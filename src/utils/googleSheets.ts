import { Flight } from "../types";

/**
 * Gets the current Google Sheets direct URL (e.g., CSV published link).
 * Defaults to the user's specific spreadsheet link.
 */
export function getGoogleSheetsUrl(): string {
  try {
    const saved = localStorage.getItem("shgm_google_sheets_url_v3");
    if (saved) return saved.trim();
  } catch (e) {
    console.error("Failed to read shgm_google_sheets_url_v3 from localStorage", e);
  }
  return "https://docs.google.com/spreadsheets/d/e/2PACX-1vSsrz179DIUtkLA4LpvlAlcReGW-HiPrOiQXnLhmRMUB9cNkSFORp7SwdwSWB-NVWmRcv5bVtPACCTP/pub?output=csv";
}

/**
 * Gets the Google Apps Script Web App API endpoint.
 * This can be deployed by the user to enable full read/write capabilities and dynamic headers creation.
 */
export function getGoogleAppsScriptUrl(): string {
  try {
    const saved = localStorage.getItem("shgm_google_apps_script_url_v3");
    if (saved) return saved.trim();
  } catch (e) {
    console.error("Failed to read shgm_google_apps_script_url_v3 from localStorage", e);
  }
  return "https://script.google.com/macros/s/AKfycbxHqFPpnQ-gV8ZKJRppvua_gIDYq2GBxGSHRd2q_1AQPv0CB_rMIIMYq56gfPm3NLeyuw/exec";
}

/**
 * Fetches all flight rows from the active Google Sheets source.
 * Dynamically switches between Google Sheet Published CSV download (GET text) 
 * and Google Apps Script JSON endpoint (GET JSON) depending on the configuration.
 */
export async function fetchFlightsFromSheet(): Promise<Flight[]> {
  const appsScriptUrl = getGoogleAppsScriptUrl();
  const sheetsCsvUrl = getGoogleSheetsUrl();

  // If we have a dynamic sheet URL that is a published CSV link, we fetch from it.
  // Otherwise, fallback to the Apps Script endpoint.
  let targetUrl = appsScriptUrl;
  let isCsv = false;

  const isPrimaryCsvUrl = sheetsCsvUrl.includes("pub?output=csv") || sheetsCsvUrl.includes("output=csv") || sheetsCsvUrl.includes("docs.google.com/spreadsheets");
  const isDefaultScriptUrl = appsScriptUrl.includes("AKfycbzFD4e-j4SeQozz9K50rndtpLd26EY-tZQsD8VEE1Wvg0bjsoGcWzLO8eyfNoDoqQReow");

  if (isPrimaryCsvUrl && (isDefaultScriptUrl || !appsScriptUrl)) {
    targetUrl = sheetsCsvUrl;
    isCsv = true;
  } else if (sheetsCsvUrl && !appsScriptUrl) {
    targetUrl = sheetsCsvUrl;
    isCsv = true;
  }

  // Double check if target URL has been overridden with a web published search link
  if (targetUrl.includes("pub?output=csv") || targetUrl.includes("output=csv") || targetUrl.includes("docs.google.com/spreadsheets/d/e/")) {
    isCsv = true;
  }

  // We use our backend CORS-free proxy to pull the data reliably without browser restrictions
  const proxyUrl = `/api/google-pull?url=${encodeURIComponent(targetUrl)}`;
  const response = await fetch(proxyUrl, {
    method: "GET"
  });

  if (!response.ok) {
    try {
      const errorJson = await response.json();
      throw new Error(errorJson.error || `Sunducu hatası: ${response.status}`);
    } catch {
      throw new Error(`Google Sheets fetch failed with status: ${response.status}`);
    }
  }

  if (isCsv) {
    const csvText = await response.text();
    return parseCSVToFlights(csvText);
  } else {
    const rawText = await response.text();
    
    // Check if the response is actually an HTML page (Google Sign-In page redirect)
    if (rawText.trim().startsWith("<!DOCTYPE") || rawText.trim().startsWith("<html")) {
      throw new Error(
        "Erişim Engellendi: Google Apps Script Web Uygulaması bir giriş sayfası (HTML) döndürdü. " +
        "Lütfen Apps Script üzerinde 'Dağıt' > 'Yeni Dağıtım' yapılandırmasında 'Kimlerin erişimi var' alanını " +
        "'Herkes' (Anyone) olarak seçtiğinizden ve gerekli tüm yetkileri onayladığınızdan emin olun."
      );
    }

    try {
      const rawData = JSON.parse(rawText);
      if (!Array.isArray(rawData)) {
        throw new Error("Geçersiz veri formatı: Google Sheets endpoint bir liste (JSON array) döndürmedi.");
      }
      return mapRawDataToFlights(rawData);
    } catch (parseError: any) {
      console.error("JSON parse error:", parseError, rawText);
      throw new Error(
        "Bağlantı/Ayrıştırma Hatası: Google Apps Script API'den alınan veri JSON formatında değil. " +
        "Lütfen script kodunu kaydedip 'Yeni Dağıtım' (New Deployment) yaptığınızdan emin olun. Hata: " + parseError.message
      );
    }
  }
}

/**
 * Saves the entire list of flights to the Google Sheets source.
 * Requires a Google Apps Script URL since published CSVs are read-only.
 */
export async function saveFlightsToSheet(flights: Flight[]): Promise<boolean> {
  const appsScriptUrl = getGoogleAppsScriptUrl();
  
  if (!appsScriptUrl || !appsScriptUrl.startsWith("https://script.google.com")) {
    throw new Error("Yazma Hatası: Bulut kaydı yapabilmek için lütfen Settings sekmesindeki yönergeleri izleyerek Google Apps Script URL'inizi tanımlayın.");
  }

  const serializedData = flights.map((item) => ({
    ...item,
    timestamps: JSON.stringify(item.timestamps || {}),
  }));

  // We use our backend CORS-free proxy to push the data reliably without browser restrictions
  const response = await fetch("/api/google-push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: appsScriptUrl,
      data: serializedData
    }),
  });

  if (!response.ok) {
    try {
      const errorJson = await response.json();
      throw new Error(errorJson.error || `Sunucu hatası: ${response.status}`);
    } catch {
      throw new Error(`Google Sheets save failed with status: ${response.status}`);
    }
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

/**
 * Robust zero-dependency client-side CSV parser.
 * Maps field headers dynamically.
 */
export function parseCSVToFlights(csvText: string): Flight[] {
  const lines = csvText.split(/\r?\n/);
  if (lines.length <= 1) return [];

  const headers = parseCSVLine(lines[0]);
  const result: Flight[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    const item: any = {};
    headers.forEach((h, idx) => {
      const cleanHeader = h.trim();
      const val = values[idx] !== undefined ? values[idx] : "";
      item[cleanHeader] = val;
    });

    if (!item.id && !item.flNo) continue; // Skip empty rows

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

    result.push({
      id: item.id ? (typeof item.id === "string" && !isNaN(Number(item.id)) ? Number(item.id) : item.id) : Date.now() + i,
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
      isDg: item.isDg === true || item.isDg === "true" || item.isDg === "TRUE" || item.isDg === "1" || item.isDg === 1,
      cancelled: item.cancelled === true || item.cancelled === "true" || item.cancelled === "TRUE" || item.cancelled === "1" || item.cancelled === 1,
      isBulk: item.isBulk === true || item.isBulk === "true" || item.isBulk === "TRUE" || item.isBulk === "1" || item.isBulk === 1,
      bulkId: item.bulkId || "",
      timestamps: parsedTimestamps,
    } as Flight);
  }

  return result;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map(v => v.replace(/^"|"$/g, '').trim());
}

/**
 * Standard mapper for Raw JSON database arrays retrieved through Apps Script.
 */
function mapRawDataToFlights(rawData: any[]): Flight[] {
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
