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
    return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), 0, 0, 0);
  }
  return new Date();
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

export const parseFlightRow = (line: string): any | null => {
  const separator = line.includes("\t") ? "\t" : line.includes(";") ? ";" : "";
  if (!separator) return null;
  const cols = line.split(separator).map(c => String(c || "").trim());
  if (cols.length < 5 || (cols[1] || "").toUpperCase() === "FLNO") return null;
  
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
    date = (start && end && start !== end) ? `${start} - ${end}` : start;
    day = cols[4] ? cols[4].replace(/\./g, "-") : getDayName(start);
    orig = cols[5]?.toUpperCase() || "IST";
    std = cols[6] || ""; 
    sta = cols[7] || "";
    dest = (cols[9] || cols[8] || "").toUpperCase();
  } else {
    date = normalizeDate(cols[2]);
    day = cols[3] || getDayName(date);
    orig = cols[4]?.toUpperCase() || "IST";
    std = cols[5] || ""; 
    sta = cols[6] || "";
    dest = (cols[8] || cols[7] || "").toUpperCase();
  }
  
  return { 
    al: cols[0] || "TK", 
    flNo: String(cols[1] || "").toUpperCase(), 
    date, 
    day, 
    orig, 
    dest, 
    std, 
    sta, 
    awbNo: "", 
    isDg: false 
  };
};
