import { Flight } from "../types";

export const GOOGLE_SHEETS_API_URL = "https://script.google.com/macros/s/AKfycbzFD4e-j4SeQozz9K50rndtpLd26EY-tZQsD8VEE1Wvg0bjsoGcWzLO8eyfNoDoqQReow/exec";

/**
 * Fetches all flight rows from the custom Google Sheets API endpoint.
 */
export async function fetchFlightsFromSheet(): Promise<Flight[]> {
  const response = await fetch(GOOGLE_SHEETS_API_URL, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Google Sheets fetch failed with status: ${response.status}`);
  }

  const rawData = await response.json();
  if (!Array.isArray(rawData)) {
    throw new Error("Invalid response format: Google Sheets endpoint returned a non-array response.");
  }

  // Normalize flight entries retrieved from the sheet cells.
  return rawData.map((item: any) => {
    let parsedTimestamps = {};
    if (item.timestamps) {
      if (typeof item.timestamps === "string" && item.timestamps.trim()) {
        try {
          parsedTimestamps = JSON.parse(item.timestamps);
        } catch (e) {
          console.warn("Could not parse timestamps string column:", item.timestamps, e);
        }
      } else if (typeof item.timestamps === "object") {
        parsedTimestamps = item.timestamps;
      }
    }

    return {
      id: item.id ? (typeof item.id === "string" && !isNaN(Number(item.id)) ? Number(item.id) : item.id) : Date.now(),
      al: String(item.al || "TK").toUpperCase(),
      flNo: String(item.flNo || ""),
      date: item.date || "",
      day: item.day || "",
      orig: String(item.orig || "IST").toUpperCase(),
      dest: String(item.dest || "").toUpperCase(),
      std: item.std || "",
      sta: item.sta || "",
      status: item.status || "PENDING",
      appType: item.appType || "yeniPermi",
      aftnNo: item.aftnNo || "",
      awbNo: item.awbNo || "",
      isDg: item.isDg === true || item.isDg === "true" || item.isDg === "TRUE" || item.isDg === 1,
      cancelled: item.cancelled === true || item.cancelled === "true" || item.cancelled === "TRUE" || item.cancelled === 1,
      isBulk: item.isBulk === true || item.isBulk === "true" || item.isBulk === "TRUE" || item.isBulk === 1,
      bulkId: item.bulkId || "",
      timestamps: parsedTimestamps,
    } as Flight;
  });
}

/**
 * Saves the entire list of flights to the custom Google Sheets API endpoint.
 * Serializes nested objects (like timestamps) to cell-friendly stringified formats.
 */
export async function saveFlightsToSheet(flights: Flight[]): Promise<boolean> {
  const serializedData = flights.map((item) => ({
    ...item,
    timestamps: JSON.stringify(item.timestamps || {}),
  }));

  // Using text/plain content type to bypass CORS OPTIONS preflight block 
  // on Google Apps Script while still sending standard stringified JSON in body.
  const response = await fetch(GOOGLE_SHEETS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(serializedData),
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Google Sheets save failed with status: ${response.status}`);
  }

  return true;
}

/**
 * Smart merges local flights with remote sheets flights.
 * Takes the union of both, matching keys by ID. Where there is a conflict,
 * it prefers the one with the more advanced status/timestamp.
 */
export function mergeFlights(local: Flight[], remote: Flight[]): Flight[] {
  const mergedMap = new Map<string | number, Flight>();

  // Load all remote flights
  remote.forEach(f => {
    mergedMap.set(f.id, f);
  });

  const getStatusWeight = (status: string) => {
    const weights: Record<string, number> = {
      PENDING: 1,
      MAIL_SENT: 2,
      DOCS_RECEIVED: 3,
      APP_MADE: 4,
      APPROVED: 5,
    };
    return weights[status] || 0;
  };

  // Merge local flights
  local.forEach(lf => {
    const rf = mergedMap.get(lf.id);
    if (!rf) {
      mergedMap.set(lf.id, lf);
    } else {
      // Conflict resolution: prefer the one that is farther along the workflow or was modified later
      const lfWeight = getStatusWeight(lf.status);
      const rfWeight = getStatusWeight(rf.status);

      if (lf.cancelled && !rf.cancelled) {
        mergedMap.set(lf.id, lf); // Prefer local cancel state
      } else if (!lf.cancelled && rf.cancelled) {
        // Keep remote cancel state
      } else if (lfWeight > rfWeight) {
        mergedMap.set(lf.id, lf);
      } else if (lfWeight === rfWeight) {
        // Check timestamps inside to find latest update
        const lfMaxTs = Math.max(...Object.values(lf.timestamps).filter((v): v is number => typeof v === "number"), 0);
        const rfMaxTs = Math.max(...Object.values(rf.timestamps).filter((v): v is number => typeof v === "number"), 0);
        if (lfMaxTs >= rfMaxTs) {
          mergedMap.set(lf.id, lf);
        }
      }
    }
  });

  return Array.from(mergedMap.values()).sort((a, b) => {
    const aTime = a.id && typeof a.id === "number" ? a.id : 0;
    const bTime = b.id && typeof b.id === "number" ? b.id : 0;
    return bTime - aTime;
  });
}
