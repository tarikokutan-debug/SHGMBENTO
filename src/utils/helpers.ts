import { SPECIAL_DESTINATIONS } from "../data";

export const getCleanStartDate = (dateStr: string): string => {
  return dateStr ? String(dateStr).split(" - ")[0].trim() : "";
};

export const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return "";
  let cleanStr = String(dateStr).replace(/\s+/g, "").replace(/[-/]/g, ".");
  const parts = cleanStr.split(".");
  if (parts.length === 3) {
    let d = parts[0].padStart(2, "0");
    let m = parts[1];
    let y = parts[2];
    if (isNaN(Number(m))) {
      const months: Record<string, string> = { 
        oca: "01", sub: "02", sube: "02", mar: "03", nis: "04", may: "05", haz: "06", 
        tem: "07", agu: "08", eyl: "09", eki: "10", kas: "11", ara: "12", jan: "01", 
        feb: "02", apr: "04", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", 
        nov: "11", dec: "12" 
      };
      m = months[m.toLowerCase().substring(0, 3)] || "01";
    } else { 
      m = m.padStart(2, "0"); 
    }
    if (y.length === 2) y = "20" + y;
    return `${d}.${m}.${y}`;
  }
  return String(dateStr);
};

export const getDayName = (dateStr: string): string => {
  if (!dateStr) return "";
  const cleanDate = getCleanStartDate(dateStr);
  const parts = cleanDate.split(".");
  if (parts.length === 3) {
    const days = ["PAZ", "PZT", "SAL", "CAR", "PER", "CUM", "CMT"];
    const dObj = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    return days[dObj.getDay()];
  }
  return "";
};

export const parseDDMMYYYY = (dateStr: string): Date => {
  const cleanDate = getCleanStartDate(dateStr);
  const parts = cleanDate.split(".");
  if (parts.length === 3) {
    const d = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const y = Number(parts[2]);
    if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
      return new Date(y, m, d, 0, 0, 0);
    }
  }
  return new Date(1900, 0, 1);
};

export const getCleanEndDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const parts = String(dateStr).split(" - ");
  return parts[parts.length - 1].trim();
};

export const parseEndDateDDMMYYYY = (dateStr: string): Date => {
  const cleanDate = getCleanEndDate(dateStr);
  const parts = cleanDate.split(".");
  if (parts.length === 3) {
    const d = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const y = Number(parts[2]);
    if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
      return new Date(y, m, d, 0, 0, 0);
    }
  }
  return new Date(1900, 0, 1);
};

export const calculateDaysLeft = (dateStr: string, currentRefDate: Date): number => {
  const cleanDate = getCleanStartDate(dateStr);
  const parts = cleanDate.split(".");
  if (parts.length !== 3) return 999;
  const flightDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  if (isNaN(flightDate.getTime())) return 999;
  const today = new Date(currentRefDate.getFullYear(), currentRefDate.getMonth(), currentRefDate.getDate());
  return Math.ceil((flightDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export const formatForMail = (dateStr: string): string => {
  if (!dateStr) return "";
  const formatSingle = (dStr: string) => {
    const parts = String(dStr).trim().split(".");
    if (parts.length !== 3) return String(dStr);
    const dObj = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    if (isNaN(dObj.getTime())) return String(dStr);
    return `${parts[0]}${dObj.toLocaleString("en-US", { month: "short" }).toUpperCase()}${String(parts[2]).slice(-2)}`;
  };
  return String(dateStr).split(" - ").map(formatSingle).join(" - ");
};

export const formatTimestamp = (ts?: number): string => {
  if (!ts) return "-";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "-";
  return `${d.toLocaleDateString("tr-TR")} ${d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`;
};

export const extractStation = (str: string): string => {
  if (!str) return "";
  const cleaned = String(str).trim();
  if (cleaned.includes("-")) {
    const parts = cleaned.split("-");
    for (const part of parts) {
      const p = part.trim();
      if (/^[A-Za-z]{3}$/.test(p)) {
        return p.toUpperCase();
      }
    }
  }
  const match = cleaned.match(/\b[A-Za-z]{3}\b/);
  if (match) {
    return match[0].toUpperCase();
  }
  return cleaned.substring(0, 3).toUpperCase();
};

export const parseFlightNumber = (str: string): { al: string; flNo: string } => {
  if (!str) return { al: "TK", flNo: "" };
  const cleaned = String(str).trim().toUpperCase();
  const match = cleaned.match(/^(THY|TK|[A-Z]{2,3})\s*(\d+[A-Z]?)$/);
  if (match) {
    const code = match[1];
    const al = code === "THY" ? "TK" : code;
    return { al, flNo: match[2] };
  }
  const digitMatch = cleaned.match(/^(\d+[A-Z]?)$/);
  if (digitMatch) {
    return { al: "TK", flNo: digitMatch[1] };
  }
  return { al: "TK", flNo: "" };
};

export const parseFlightRow = (line: string): any | null => {
  if (!line || !line.trim()) return null;
  const rawLine = line.trim();

  const upper = rawLine.toUpperCase();
  if (
    upper.includes("FLNO") ||
    upper.includes("CALLSIGN") ||
    upper.includes("SIRA NO") ||
    upper.startsWith("NO\t") ||
    upper.includes("HAVALIMANLARI")
  ) {
    return null;
  }

  let separator: string | RegExp = "\t";
  if (rawLine.includes("\t")) {
    separator = "\t";
  } else if (rawLine.includes(";")) {
    separator = ";";
  } else if (/\s{2,}/.test(rawLine)) {
    separator = /\s{2,}/;
  } else {
    separator = " ";
  }

  const cols = rawLine.split(separator).map((c) => String(c || "").trim()).filter((c) => c !== "");
  if (cols.length < 3) return null;

  const isFirstRowNo = /^\d{1,3}$/.test(cols[0]);
  const colShift = isFirstRowNo && cols.length >= 6 ? 1 : 0;

  const flCol = cols[0 + colShift];
  const origCol = cols[1 + colShift];

  if (flCol && origCol) {
    const isTime = (str: string) => /^\d{1,2}:\d{2}$/.test(str);
    const isDate = (str: string) => /^\d{1,2}[\.\/-]\d{1,2}[\.\/-]\d{2,4}$/.test(str);

    const colA = cols[2 + colShift] || "";
    const colB = cols[3 + colShift] || "";

    if ((isTime(colA) || isDate(colA)) && (isTime(colB) || isDate(colB) || cols.length >= 5 + colShift)) {
      const { al, flNo } = parseFlightNumber(flCol);
      const orig = extractStation(origCol);

      let std = "";
      let date = "";

      if (isTime(colA)) std = colA;
      else if (isDate(colA)) date = normalizeDate(colA);

      if (isTime(colB)) std = colB;
      else if (isDate(colB)) date = normalizeDate(colB);

      const destCol = cols[4 + colShift] || "";
      const dest = extractStation(destCol);

      const staCol = cols[5 + colShift] || "";
      let sta = "";
      if (isTime(staCol)) {
        sta = staCol;
      }

      if (!date) {
        for (let i = 0; i < cols.length; i++) {
          if (isDate(cols[i])) {
            date = normalizeDate(cols[i]);
            break;
          }
        }
      }

      if (flNo && /^\d+[A-Z]?$/.test(flNo) && orig && dest) {
        const day = getDayName(date);
        return {
          al,
          flNo,
          date,
          day,
          orig,
          dest,
          std,
          sta,
          awbNo: "",
          isDg: false,
        };
      }
    }
  }

  let date = "";
  let day = "";
  let orig = "IST";
  let dest = "";
  let std = "";
  let sta = "";

  const isFormat1 = cols.length > 9 || /\d/.test(cols[3] || "");
  if (isFormat1) {
    const start = normalizeDate(cols[2]);
    const end = normalizeDate(cols[3]);
    date = start && end && start !== end ? `${start} - ${end}` : start;
    day = cols[4] ? cols[4].replace(/\./g, "-") : getDayName(start);
    orig = extractStation(cols[5]) || "IST";
    std = cols[6] || "";
    sta = cols[7] || "";
    dest = extractStation(cols[9] || cols[8] || "");
  } else {
    date = normalizeDate(cols[2]);
    day = cols[3] || getDayName(date);
    orig = extractStation(cols[4]) || "IST";
    std = cols[5] || "";
    sta = cols[6] || "";
    dest = extractStation(cols[8] || cols[7] || "");
  }

  const { al, flNo } = parseFlightNumber(cols[1] ? cols[1] : cols[0]);

  if (!flNo || !/^\d+[A-Z]?$/.test(flNo)) {
    return null;
  }

  return {
    al: al || cols[0] || "TK",
    flNo,
    date,
    day,
    orig,
    dest,
    std,
    sta,
    awbNo: "",
    isDg: false,
  };
};

export const formatShortAviationDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  const parseSingle = (s: string) => {
    const trimmed = String(s || "").trim();
    if (!trimmed) return "";
    let m = trimmed.match(/^(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{2,4})$/);
    if (m) {
      const day = parseInt(m[1], 10);
      const monthIdx = parseInt(m[2], 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day < 10 ? "0" + day : day}${months[monthIdx]}`;
      }
    }
    m = trimmed.match(/^(\d{4})[\.\/-](\d{1,2})[\.\/-](\d{1,2})$/);
    if (m) {
      const day = parseInt(m[3], 10);
      const monthIdx = parseInt(m[2], 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day < 10 ? "0" + day : day}${months[monthIdx]}`;
      }
    }
    return trimmed;
  };

  if (dateStr.includes(" - ")) {
    const parts = dateStr.split(" - ");
    const p1 = parseSingle(parts[0]);
    const p2 = parseSingle(parts[1]);
    if (p1 && p2 && p1 !== p2) return `${p1}-${p2}`;
    return p1 || dateStr;
  }

  return parseSingle(dateStr);
};

export const formatGroupRoute = (flights: any[]): string => {
  if (!flights || flights.length === 0) return "";
  const stops: string[] = [];
  flights.forEach((f) => {
    const orig = String(f?.orig || "").trim().toUpperCase();
    const dest = String(f?.dest || "").trim().toUpperCase();
    if (orig && (stops.length === 0 || stops[stops.length - 1] !== orig)) {
      stops.push(orig);
    }
    if (dest && (stops.length === 0 || stops[stops.length - 1] !== dest)) {
      stops.push(dest);
    }
  });
  return stops.join("-");
};

export const getSpecialStationCode = (flights: any[]): string | null => {
  if (!flights || flights.length === 0) return null;
  for (const f of flights) {
    const dest = String(f?.dest || "").trim().toUpperCase();
    if (SPECIAL_DESTINATIONS.includes(dest)) return dest;
    const orig = String(f?.orig || "").trim().toUpperCase();
    if (SPECIAL_DESTINATIONS.includes(orig)) return orig;
  }
  return null;
};
