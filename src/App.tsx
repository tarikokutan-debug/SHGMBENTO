import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  Plane,
  FileText,
  CheckCircle,
  Clock,
  Search,
  UploadCloud,
  RefreshCw,
  Check,
  AlertCircle,
  ArrowRight,
  Trash2,
  Plus,
  X,
  XCircle,
  Mail,
  Table as TableIcon,
  LayoutDashboard,
  FileDigit,
  Download,
  Ban,
  Home,
  BellRing,
  Edit,
  Eye,
  Radiation,
  MoreHorizontal,
  Loader,
  CreditCard,
} from "lucide-react";

import { Flight, AppFees, StationEmails } from "./types";
import {
  STORAGE_KEY,
  EMAILS_STORAGE_KEY,
  FEES_STORAGE_KEY,
  INITIAL_FLIGHTS,
  SPECIAL_DESTINATIONS,
  INITIAL_FEES,
  APP_TYPES,
  INITIAL_EMAILS,
  STANDARD_WORKFLOW,
  SPECIAL_WORKFLOW,
} from "./data";
import {
  normalizeDate,
  getDayName,
  calculateDaysLeft,
  formatForMail,
  formatTimestamp,
  parseFlightRow,
} from "./utils/helpers";
import {
  fetchFlightsFromSheet,
  saveFlightsToSheet,
  mergeFlights,
} from "./utils/googleSheets";

// Sub-components
import DevirModal from "./components/DevirModal";
import MailPreviewModal from "./components/MailPreviewModal";
import EditGroupModal from "./components/EditGroupModal";
import ReportingView from "./components/ReportingView";
import SettingsView from "./components/SettingsView";

export default function App() {
  const [flights, setFlights] = useState<Flight[]>(INITIAL_FLIGHTS);
  const [stationEmails, setStationEmails] = useState<StationEmails>(INITIAL_EMAILS);
  const [appFees, setAppFees] = useState<AppFees>(INITIAL_FEES);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentView, setCurrentView] = useState("HOME");
  const [operationsTab, setOperationsTab] = useState("ACTIVE");
  const [settingsTab, setSettingsTab] = useState<"EMAILS" | "FEES" | "DATA">("EMAILS");
  const [feeYear, setFeeYear] = useState("2026");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Filter States
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [destFilter, setDestFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [settingsSearch, setSettingsSearch] = useState("");

  // Auto Backup Reminder State
  const [isBackupReminderOpen, setIsBackupReminderOpen] = useState(false);

  // Settings State Managers
  const [newStationCode, setNewStationCode] = useState("");
  const [newStationEmail, setNewStationEmail] = useState("");
  const [newEmailInput, setNewEmailInput] = useState<Record<string, string>>({});

  // Modals & Flows States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMailModalOpen, setIsMailModalOpen] = useState(false);
  const [selectedFlightForMail, setSelectedFlightForMail] = useState<any | null>(null);
  const [isAftnModalOpen, setIsAftnModalOpen] = useState(false);
  const [selectedFlightForAftn, setSelectedFlightForAftn] = useState<any | null>(null);
  const [aftnInput, setAftnInput] = useState("");
  const [aftnAppType, setAftnAppType] = useState<any>("yeniPermi");

  const [isArchiveAddModalOpen, setIsArchiveAddModalOpen] = useState(false);
  const [archiveAftn, setArchiveAftn] = useState("");
  const [archiveAppType, setArchiveAppType] = useState<any>("yeniPermi");
  const [archivePasteContent, setArchivePasteContent] = useState("");
  const [archiveParsedData, setArchiveParsedData] = useState<any[]>([]);
  const [isArchiveDetailModalOpen, setIsArchiveDetailModalOpen] = useState(false);
  const [selectedArchiveGroup, setSelectedArchiveGroup] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editGroupData, setEditGroupData] = useState<any>({ aftnNo: "", appType: "yeniPermi", flights: [] });

  const [isDevirModalOpen, setIsDevirModalOpen] = useState(false);
  const [excelPasteContent, setExcelPasteContent] = useState("");
  const [parsedTableData, setParsedTableData] = useState<string[][]>([]);
  const [calculatedRecipients, setCalculatedRecipients] = useState("");
  const [missingStations, setMissingStations] = useState<string[]>([]);
  const [addMode, setAddMode] = useState("SINGLE");
  const [dashboardPasteContent, setDashboardPasteContent] = useState("");
  const [dashboardParsedData, setDashboardParsedData] = useState<any[]>([]);
  const [dashboardAppType, setDashboardAppType] = useState<any>("yeniPermi");
  const [newFlight, setNewFlight] = useState({
    al: "TK",
    flNo: "",
    date: "",
    orig: "IST",
    dest: "",
    std: "",
    sta: "",
    awbNo: "",
    isDg: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // --- GOOGLE SHEETS SYSTEM STATES ---
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem("shgm_auto_sync_v2");
      return saved === "true";
    } catch {
      return false;
    }
  });
  const [googleSyncStatus, setGoogleSyncStatus] = useState<"idle" | "loading" | "saving" | "success" | "error">("idle");
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(() => {
    try {
      const saved = localStorage.getItem("shgm_last_sync_v2");
      return saved ? new Date(saved) : null;
    } catch {
      return null;
    }
  });

  const [googleSheetsUrl, setGoogleSheetsUrlState] = useState(() => {
    try {
      const saved = localStorage.getItem("shgm_google_sheets_url_v3");
      return saved || "https://docs.google.com/spreadsheets/d/e/2PACX-1vSsrz179DIUtkLA4LpvlAlcReGW-HiPrOiQXnLhmRMUB9cNkSFORp7SwdwSWB-NVWmRcv5bVtPACCTP/pub?output=csv";
    } catch {
      return "https://docs.google.com/spreadsheets/d/e/2PACX-1vSsrz179DIUtkLA4LpvlAlcReGW-HiPrOiQXnLhmRMUB9cNkSFORp7SwdwSWB-NVWmRcv5bVtPACCTP/pub?output=csv";
    }
  });

  const [googleAppsScriptUrl, setGoogleAppsScriptUrlState] = useState(() => {
    try {
      const saved = localStorage.getItem("shgm_google_apps_script_url_v3");
      return saved || "https://script.google.com/macros/s/AKfycbzFD4e-j4SeQozz9K50rndtpLd26EY-tZQsD8VEE1Wvg0bjsoGcWzLO8eyfNoDoqQReow/exec";
    } catch {
      return "https://script.google.com/macros/s/AKfycbzFD4e-j4SeQozz9K50rndtpLd26EY-tZQsD8VEE1Wvg0bjsoGcWzLO8eyfNoDoqQReow/exec";
    }
  });

  const setGoogleSheetsUrl = (url: string) => {
    setGoogleSheetsUrlState(url);
    localStorage.setItem("shgm_google_sheets_url_v3", url);
  };

  const setGoogleAppsScriptUrl = (url: string) => {
    setGoogleAppsScriptUrlState(url);
    localStorage.setItem("shgm_google_apps_script_url_v3", url);
  };

  const isSyncingRef = useRef(false);
  const hasInitialPulledRef = useRef(false);

  // Load local state initially
  useEffect(() => {
    try {
      const savedFlights = localStorage.getItem(STORAGE_KEY);
      if (savedFlights) {
        const parsedF = JSON.parse(savedFlights);
        if (Array.isArray(parsedF)) setFlights(parsedF);
      }
      const savedEmails = localStorage.getItem(EMAILS_STORAGE_KEY);
      if (savedEmails) {
        const parsedE = JSON.parse(savedEmails);
        if (parsedE && typeof parsedE === "object") setStationEmails(parsedE);
      }
      const savedFees = localStorage.getItem(FEES_STORAGE_KEY);
      if (savedFees) {
        const parsedFees = JSON.parse(savedFees);
        if (parsedFees && typeof parsedFees === "object") {
          if (parsedFees.yeniPermi !== undefined) {
            setAppFees({ "2026": parsedFees });
          } else {
            setAppFees(parsedFees);
            setFeeYear(Object.keys(parsedFees).sort().reverse()[0] || "2026");
          }
        }
      }
    } catch (e) {
      console.error("Yukleme hatasi", e);
    }
    setIsLoaded(true);
  }, []);

  // Sync back local storage changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(flights));
      localStorage.setItem(EMAILS_STORAGE_KEY, JSON.stringify(stationEmails));
      localStorage.setItem(FEES_STORAGE_KEY, JSON.stringify(appFees));
    }
  }, [flights, stationEmails, appFees, isLoaded]);

  // Handle remote fetch and sync
  const handleGooglePull = useCallback(async (isInitial = false) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setGoogleSyncStatus("loading");
    try {
      const remoteFlights = await fetchFlightsFromSheet();
      setFlights((prevLocal) => {
        // Safe check to avoid blanking out the local state on sheets misfire/empty
        if (remoteFlights.length === 0 && prevLocal.length > 0) {
          if (isInitial) {
            // Push active data up to vacant sheets securely
            saveFlightsToSheet(prevLocal).catch((err) => console.error("Sheets push failed:", err));
            return prevLocal;
          }
          if (window.confirm("Google Sheet boş görünüyor. Yerel verilerinizi silmek yerine Google Sheet'e yüklemek ister misiniz?")) {
            saveFlightsToSheet(prevLocal).catch((err) => console.error("Sheets push failed:", err));
            return prevLocal;
          }
        }
        return mergeFlights(prevLocal, remoteFlights);
      });
      setGoogleSyncStatus("success");
      const now = new Date();
      setLastSyncTime(now);
      localStorage.setItem("shgm_last_sync_v2", now.toISOString());
      setTimeout(() => setGoogleSyncStatus("idle"), 2500);
    } catch (err) {
      console.error("Pull hatasi:", err);
      setGoogleSyncStatus("error");
      setTimeout(() => setGoogleSyncStatus("idle"), 4000);
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  const handleGooglePush = useCallback(async () => {
    isSyncingRef.current = true;
    setGoogleSyncStatus("saving");
    try {
      await saveFlightsToSheet(flights);
      setGoogleSyncStatus("success");
      const now = new Date();
      setLastSyncTime(now);
      localStorage.setItem("shgm_last_sync_v2", now.toISOString());
      setTimeout(() => setGoogleSyncStatus("idle"), 2500);
    } catch (err) {
      console.error("Push hatasi:", err);
      setGoogleSyncStatus("error");
      setTimeout(() => setGoogleSyncStatus("idle"), 4000);
    } finally {
      isSyncingRef.current = false;
    }
  }, [flights]);

  const handleGoogleFullSync = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setGoogleSyncStatus("loading");
    try {
      const remote = await fetchFlightsFromSheet();
      let merged: Flight[] = [];
      setFlights((prev) => {
        merged = mergeFlights(prev, remote);
        return merged;
      });
      await saveFlightsToSheet(merged);
      setGoogleSyncStatus("success");
      const now = new Date();
      setLastSyncTime(now);
      localStorage.setItem("shgm_last_sync_v2", now.toISOString());
      setTimeout(() => setGoogleSyncStatus("idle"), 2500);
    } catch (err) {
      console.error("Full Sync hatasi:", err);
      setGoogleSyncStatus("error");
      setTimeout(() => setGoogleSyncStatus("idle"), 4000);
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  // Background sync once database is loaded
  useEffect(() => {
    if (isLoaded && !hasInitialPulledRef.current) {
      hasInitialPulledRef.current = true;
      handleGooglePull(true);
    }
  }, [isLoaded, handleGooglePull]);

  // Debounced auto-save hook
  const autoSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!isLoaded || !autoSyncEnabled || isSyncingRef.current) return;

    if (autoSyncTimerRef.current) clearTimeout(autoSyncTimerRef.current);
    autoSyncTimerRef.current = setTimeout(() => {
      handleGooglePush();
    }, 2000);

    return () => {
      if (autoSyncTimerRef.current) clearTimeout(autoSyncTimerRef.current);
    };
  }, [flights, autoSyncEnabled, handleGooglePush, isLoaded]);

  useEffect(() => {
    localStorage.setItem("shgm_auto_sync_v2", autoSyncEnabled ? "true" : "false");
  }, [autoSyncEnabled]);

  // Notifications and devir reminders setup
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    const backupInterval = setInterval(() => {
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("SHGM Takip - Yedekleme Hatirlatmasi", {
            body: "Son yedeklemeden bu yana 30 dakika gecti. Veri kaybini onlemek icin lutfen yedek aliniz.",
          });
        } catch (err) {
          console.error("Notification trigger bypass:", err);
        }
      }
      setIsBackupReminderOpen(true);
    }, 30 * 60 * 1000);
    return () => clearInterval(backupInterval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentDate(now);
      const day = now.getDay();
      const isWeekday = day >= 1 && day <= 5;
      const h = now.getHours();
      const m = now.getMinutes();
      if (isWeekday && h === 16 && m >= 30) {
        const todayStr = now.toISOString().slice(0, 10);
        const alreadyShown = localStorage.getItem("devir_alert_shown");
        if (alreadyShown !== todayStr) {
          setIsDevirModalOpen(true);
          localStorage.setItem("devir_alert_shown", todayStr);
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- PERSISTENCE DOWNLOAD & PARSERS ---
  const manualDownload = useCallback(() => {
    const filename = `shgm_takip_yedek_${new Date().toISOString().slice(0, 10)}.json`;
    const blob = new Blob([JSON.stringify(flights, null, 2)], { type: "application/json" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(u);
  }, [flights]);

  const importFromJson = useCallback((file: File) => {
    const r = new FileReader();
    r.onload = (e) => {
      try {
        const d = JSON.parse(e.target?.result as string);
        if (Array.isArray(d)) {
          if (window.confirm("Mevcut yerel veriler silinip yuklenen dosya basilacak. Devam?")) {
            setFlights(d);
          }
        } else alert("Gecersiz dosya formati.");
      } catch {
        alert("Dosya okunamadi.");
      }
    };
    r.readAsText(file);
  }, []);

  const triggerSafeMailto = (mailtoUrl: string) => {
    const a = document.createElement("a");
    a.href = mailtoUrl;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const processEmailPasteData = (data: string[][]) => {
    const emailSet = new Set<string>();
    const missing = new Set<string>();
    data.forEach((row) => {
      const from = String(row[1] || "").toUpperCase().trim();
      if (from) {
        if (stationEmails[from]) {
          stationEmails[from].forEach((e) => emailSet.add(e));
        } else {
          missing.add(from);
        }
      }
    });
    setParsedTableData(data);
    setCalculatedRecipients(Array.from(emailSet).join("; "));
    setMissingStations(Array.from(missing));
  };

  const handleExcelPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setExcelPasteContent(text);
    if (text.includes("\t")) {
      const rows = text.trim().split(/\r?\n/).map((r) => r.split("\t"));
      processEmailPasteData(rows);
      return;
    }
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const data: string[][] = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("235")) {
        const from = lines[i + 1] || "";
        const to = lines[i + 2] || "";
        if (from && to && from !== "FS" && to !== "FS") data.push([lines[i], from, to]);
      }
    }
    processEmailPasteData(data);
  };

  // Safe status updates helper
  const updateStatusGroupOrSingle = (flightOrGroup: any, newStatusKey: string, extraData = {}) => {
    const isGroup = !!flightOrGroup.flights;
    const idsToUpdate = isGroup ? flightOrGroup.flights.map((f: any) => f.id) : [flightOrGroup.id];
    setFlights((prev) =>
      prev.map((f) => {
        if (idsToUpdate.includes(f.id)) {
          return {
            ...f,
            status: newStatusKey as any,
            timestamps: { ...(f.timestamps || {}), [newStatusKey]: Date.now() },
            ...extraData,
          };
        }
        return f;
      })
    );
  };

  const handleStatusClick = (flightOrGroup: any, targetStatusKey: string) => {
    const isGroup = !!flightOrGroup.flights;
    const flightsToCheck = isGroup ? flightOrGroup.flights : [flightOrGroup];
    if (!flightsToCheck || flightsToCheck.length === 0) return;
    const isSpecial = flightsToCheck.some((f: any) => SPECIAL_DESTINATIONS.includes(String(f.dest || "").toUpperCase()));
    const currentWorkflow = isSpecial ? SPECIAL_WORKFLOW : STANDARD_WORKFLOW;
    const flowKeys = ["PENDING", ...currentWorkflow.map((w) => w.key)];
    let currentIndex = flowKeys.indexOf(String(flightOrGroup.status || ""));
    if (currentIndex === -1) currentIndex = 0;
    const targetIndex = flowKeys.indexOf(targetStatusKey);

    if (targetIndex <= currentIndex + 1) {
      if (targetStatusKey === "MAIL_SENT") {
        setSelectedFlightForMail(flightOrGroup);
        setExcelPasteContent("");
        setParsedTableData([]);
        setCalculatedRecipients("");
        setMissingStations([]);
        setIsMailModalOpen(true);
        return;
      }

      if (targetStatusKey === "APP_MADE") {
        setSelectedFlightForAftn(flightOrGroup);
        setAftnInput(flightOrGroup.aftnNo || "");
        setAftnAppType(flightOrGroup.appType || flightsToCheck[0].appType || "yeniPermi");
        setIsAftnModalOpen(true);
        return;
      }

      if (targetStatusKey === "APPROVED" && targetIndex > currentIndex) {
        const mailDate = formatForMail(flightsToCheck[0].date);
        let flCode = "";
        const targetDest = String(flightsToCheck[0].dest || "").toUpperCase().trim();
        if (SPECIAL_DESTINATIONS.includes(targetDest)) {
          flCode = targetDest + " Turkish Civil Aviation Permission";
        } else {
          const dateRawStr = String(flightsToCheck[0].date || "");
          flCode = dateRawStr.includes("-") || dateRawStr.includes(" ") ? "DONEMSEL DEGISIKLIK" : "MUNFERIT DEGISIKLIK";
        }
        const route = flightOrGroup.isBulk ? "COKLU PARKUR" : `${String(flightsToCheck[0].orig || "")}-${String(flightsToCheck[0].dest || "")}-${String(flightsToCheck[0].orig || "")}`;
        const seferBilgisi = `${mailDate} ${flCode} ${route}`;
        const mailtoUrl = `mailto:COCC@THY.COM,FOCCOPSSLOT@THY.COM?cc=cargoslot@thy.com&subject=${encodeURIComponent(
          `${seferBilgisi} SHGM IZIN TEMINI`
        )}&body=${encodeURIComponent(
          `Sayin ilgililer,\n\n${seferBilgisi} ucusunun SHGM izinleri ekteki belgelerle birlikte basvurularak temin edilmistir.\n\nBilgilerinize arz eder, iyi calismalar dilerim.`
        )}`;
        triggerSafeMailto(mailtoUrl);
        updateStatusGroupOrSingle(flightOrGroup, targetStatusKey);
        return;
      }

      if (targetIndex < currentIndex) {
        if (window.confirm("Durumu geriye almak istediginize emin misiniz?")) {
          updateStatusGroupOrSingle(flightOrGroup, targetStatusKey);
        }
      } else {
        updateStatusGroupOrSingle(flightOrGroup, targetStatusKey);
      }
    }
  };

  const sendEmail = () => {
    if (!selectedFlightForMail) return;
    const flightsToMail = selectedFlightForMail.flights || [selectedFlightForMail];
    const mailDisplayFlight = flightsToMail[0];
    if (!mailDisplayFlight) return;
    const mailDate = formatForMail(mailDisplayFlight.date);
    const targetDest = String(mailDisplayFlight.dest || "").toUpperCase().trim();
    const isSpecialDest = SPECIAL_DESTINATIONS.includes(targetDest);

    let flightCode = "";
    if (isSpecialDest) {
      flightCode = targetDest + " Turkish Civil Aviation Permission";
    } else {
      const dateRawStr = String(mailDisplayFlight.date || "");
      flightCode = dateRawStr.includes("-") || dateRawStr.includes(" ") ? "DONEMSEL DEGISIKLIK" : "MUNFERIT DEGISIKLIK";
    }

    let htmlTable = "";
    if (parsedTableData.length > 0) {
      htmlTable = `<table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse;font-family:-apple-system, BlinkMacSystemFont, sans-serif;font-size:13px;margin:15px 0;max-width:400px;text-align:left;">
        <thead><tr style="background:#F5F5F7;"><th>AWB</th><th>FROM</th><th>TO</th></tr></thead>
        <tbody>${parsedTableData
          .map(
            (r) =>
              `<tr><td style="border-bottom: 1px solid #e5e5e5;">${String(r[0] || "")}</td><td style="font-weight:600;color:#C8102E;border-bottom: 1px solid #e5e5e5;">${String(
                r[1] || ""
              )}</td><td style="border-bottom: 1px solid #e5e5e5;">${String(r[2] || "")}</td></tr>`
          )
          .join("")}</tbody>
      </table>`;
    }

    let subject = "";
    if (isSpecialDest) {
      const fullFlightNo = `${String(mailDisplayFlight.al || "TK")}${String(mailDisplayFlight.flNo || "")}`;
      const routeStr = `${String(mailDisplayFlight.orig || "IST")}-${targetDest}`;
      subject = `${fullFlightNo} ${routeStr} ${flightCode} `;
    } else {
      subject = `${flightCode} / ${mailDate} / Turkish Civil Aviation Permission`;
    }

    const htmlBody = `<div style="font-family:-apple-system, BlinkMacSystemFont, sans-serif;font-size:14px;color:#1D1D1F;">
      <p>Dear all concerned,</p><br/>
      <p>To apply for Turkish Civil Aviation Permission, we require one signed and stamped copy of <strong>the AWB and the corresponding signed and stamped Invoice</strong> for the flight listed below:</p>
      <p style="background:#FFF9C4;font-weight:600;font-size:14px;padding:8px;border-radius:4px;display:inline-block;">&gt;&gt;&gt; ${mailDate} ${flightCode} &lt;&lt;&lt;</p>
      <p><strong style="color:#C8102E;font-size:14px;">*** IMPORTANT ***:</strong> Please ensure that the Flight Date and Flight Number on the AWB and Invoice exactly match the requested details below (<strong>${mailDate} ${flightCode}</strong>).<br/>Documents with mismatched flight details will not be accepted.</p>
      ${htmlTable}
      <p>Requirements:<br/>1. Both the AWB and Invoice must be signed and stamped, as mandated by the Turkish Directorate General of Civil Aviation (DGCA).<br/>2. Please ensure the AWB includes the IATA Agent's Code.</p><br/>
      <p>Thank you in advance for your cooperation.</p>
    </div>`;

    const el = document.createElement("div");
    el.innerHTML = htmlBody;
    el.style.position = "absolute";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    sel?.removeAllRanges();
    sel?.addRange(range);
    document.execCommand("copy");
    sel?.removeAllRanges();
    document.body.removeChild(el);

    const mailtoUrl = `mailto:${calculatedRecipients}?cc=cargoslot@thy.com;COCC@THY.COM&subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent("Lutfen kopyalanan mail icerigini buraya yapistirin (CTRL + V).")}`;
    triggerSafeMailto(mailtoUrl);

    setIsMailModalOpen(false);
    updateStatusGroupOrSingle(selectedFlightForMail, "MAIL_SENT");
  };

  const handleAftnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlightForAftn || !aftnInput.trim()) {
      alert("Gecerli bir AFTN Numarasi girin.");
      return;
    }
    const isGroup = !!selectedFlightForAftn.flights;
    const idsToUpdate = isGroup ? selectedFlightForAftn.flights.map((f: any) => f.id) : [selectedFlightForAftn.id];
    setFlights((prev) =>
      prev.map((f) => {
        if (idsToUpdate.includes(f.id)) {
          return {
            ...f,
            status: "APP_MADE",
            aftnNo: String(aftnInput).trim().toUpperCase(),
            appType: aftnAppType,
            timestamps: { ...(f.timestamps || {}), APP_MADE: Date.now() },
          };
        }
        return f;
      })
    );
    setIsAftnModalOpen(false);
  };

  const handleDashboardPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setDashboardPasteContent(text);
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
    const parsed: any[] = [];
    lines.forEach((line, index) => {
      const flightData = parseFlightRow(line);
      if (flightData) {
        parsed.push({
          id: Date.now() + index + Math.random(),
          ...flightData,
          status: "PENDING",
          appType: dashboardAppType,
          aftnNo: "",
          timestamps: {},
          isBulk: false,
        });
      }
    });
    setDashboardParsedData(parsed);
  };

  const handleDashboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (addMode === "BULK") {
      if (dashboardParsedData.length === 0) return;
      const newBulkId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      const finalData = dashboardParsedData.map((f) => ({
        ...f,
        appType: dashboardAppType,
        bulkId: newBulkId,
        isBulk: true,
      }));
      setFlights((prev) => [...prev, ...finalData]);
      setIsAddModalOpen(false);
      setDashboardPasteContent("");
      setDashboardParsedData([]);
      setAddMode("SINGLE");
    } else {
      if (!newFlight.flNo || !newFlight.date || !newFlight.dest) return;
      const isSpecialDest = SPECIAL_DESTINATIONS.includes(String(newFlight.dest).toUpperCase());
      setFlights((prev) => [
        ...prev,
        {
          id: Date.now(),
          al: String(newFlight.al || "TK").toUpperCase(),
          flNo: String(newFlight.flNo).toUpperCase(),
          date: normalizeDate(newFlight.date),
          day: getDayName(normalizeDate(newFlight.date)),
          orig: String(newFlight.orig).toUpperCase(),
          dest: String(newFlight.dest).toUpperCase(),
          std: newFlight.std,
          sta: newFlight.sta,
          status: "PENDING",
          appType: dashboardAppType,
          aftnNo: "",
          awbNo: isSpecialDest ? newFlight.awbNo : "",
          isDg: isSpecialDest ? newFlight.isDg : false,
          timestamps: {},
        },
      ]);
      setIsAddModalOpen(false);
      setNewFlight({ al: "TK", flNo: "", date: "", orig: "IST", dest: "", std: "", sta: "", awbNo: "", isDg: false });
    }
  };

  const saveEditGroup = (e: React.FormEvent) => {
    e.preventDefault();
    setFlights((prev) =>
      prev.map((f) => {
        const editedFlight = editGroupData.flights.find((ef: any) => ef.id === f.id);
        if (editedFlight) {
          const normalized = normalizeDate(editedFlight.date);
          return {
            ...f,
            al: String(editedFlight.al || "").toUpperCase(),
            flNo: String(editedFlight.flNo || "").toUpperCase(),
            date: normalized,
            day: getDayName(normalized) || f.day,
            orig: String(editedFlight.orig || "").toUpperCase(),
            dest: String(editedFlight.dest || "").toUpperCase(),
            std: String(editedFlight.std || ""),
            sta: String(editedFlight.sta || ""),
            appType: editGroupData.appType,
            awbNo: String(editedFlight.awbNo || ""),
            isDg: Boolean(editedFlight.isDg),
            aftnNo: String(editGroupData.aftnNo || "").toUpperCase(),
          };
        }
        return f;
      })
    );
    setIsEditModalOpen(false);
  };

  const openEditModal = (group: any) => {
    if (!group || !group.flights || group.flights.length === 0) return;
    setEditGroupData({
      groupId: group.groupId,
      aftnNo: group.aftnNo !== "-" ? group.aftnNo : "",
      appType: group.flights[0]?.appType || "yeniPermi",
      flights: JSON.parse(JSON.stringify(group.flights || [])),
    });
    setIsEditModalOpen(true);
  };

  const approveArchiveGroup = (groupId: string) => {
    if (window.confirm("Gruptaki TUM seferlerin onaylandigini isaretlemek istiyor musunuz?")) {
      setFlights((prev) =>
        prev.map((f) => {
          const key = f.aftnNo ? String(f.aftnNo) : f.bulkId ? `BULK_${f.bulkId}` : `SINGLE_${f.id}`;
          if (key === groupId && f.status !== "APPROVED" && f.status !== "REJECTED") {
            return { ...f, status: "APPROVED", timestamps: { ...(f.timestamps || {}), APPROVED: Date.now() } };
          }
          return f;
        })
      );
    }
  };

  const rejectGroupAndClone = (groupId: string) => {
    if (
      window.confirm(
        "Bu basvuru REDDEDILDI olarak isaretlenecek. Arsive tasinacak ve otomatik olarak yeni bir basvuru kopyasi (bekleyen) olusturulacaktir. Onayliyor musunuz?"
      )
    ) {
      setFlights((prev) => {
        const updatedFlights: Flight[] = [];
        const newCopies: Flight[] = [];
        prev.forEach((f) => {
          const key = f.aftnNo ? String(f.aftnNo) : f.bulkId ? `BULK_${f.bulkId}` : `SINGLE_${f.id}`;
          if (key === groupId && f.status !== "APPROVED" && f.status !== "REJECTED" && !f.cancelled) {
            updatedFlights.push({ ...f, status: "REJECTED", timestamps: { ...(f.timestamps || {}), REJECTED: Date.now() } });
            newCopies.push({
              ...f,
              id: Date.now() + Math.random(),
              status: "PENDING",
              aftnNo: "",
              timestamps: {},
              bulkId: f.bulkId || "",
              isBulk: f.isBulk || false,
            });
          } else {
            updatedFlights.push(f);
          }
        });
        return [...updatedFlights, ...newCopies];
      });
    }
  };

  const resetGroup = (groupId: string) => {
    if (window.confirm("Sureci sifirlamak istiyor musunuz? (Varsa AFTN silinir)")) {
      setFlights((prev) =>
        prev.map((f) => {
          const key = f.aftnNo ? String(f.aftnNo) : f.bulkId ? `BULK_${f.bulkId}` : `SINGLE_${f.id}`;
          if (key === groupId) {
            return { ...f, status: "PENDING", timestamps: {}, aftnNo: "" };
          }
          return f;
        })
      );
    }
  };

  const deleteGroup = (groupId: string) => {
    if (window.confirm("Silmek istediginize emin misiniz?")) {
      setFlights((prev) =>
        prev.filter((f) => {
          const key = f.aftnNo ? String(f.aftnNo) : f.bulkId ? `BULK_${f.bulkId}` : `SINGLE_${f.id}`;
          return key !== groupId;
        })
      );
    }
  };

  const cancelGroup = (groupId: string) => {
    if (window.confirm("Sefer iptal mi oldu? 'IPTAL' olarak arsivlenecek.")) {
      setFlights((prev) =>
        prev.map((f) => {
          const key = f.aftnNo ? String(f.aftnNo) : f.bulkId ? `BULK_${f.bulkId}` : `SINGLE_${f.id}`;
          if (key === groupId) {
            return { ...f, status: "APPROVED", cancelled: true, timestamps: { ...(f.timestamps || {}), CANCELLED: Date.now() } };
          }
          return f;
        })
      );
    }
  };

  const clearAllData = () => {
    if (window.confirm("DIKKAT: Tum veriler silinecek.")) {
      localStorage.removeItem(STORAGE_KEY);
      setFlights(INITIAL_FLIGHTS);
    }
  };

  // --- SETTINGS DISPATCH ACTIONS ---
  const handleAddStation = (e: React.FormEvent) => {
    e.preventDefault();
    const code = String(newStationCode).toUpperCase().trim();
    const email = String(newStationEmail).toUpperCase().trim();
    if (!code) return;
    setStationEmails((prev) => ({
      ...prev,
      [code]: prev[code] ? [...new Set([...prev[code], email])] : email ? [email] : [],
    }));
    setNewStationCode("");
    setNewStationEmail("");
  };

  const handleAddEmailToStation = (stationCode: string, email: string) => {
    if (!email || !String(email).trim()) return;
    const upperEmail = String(email).toUpperCase().trim();
    setStationEmails((prev) => ({
      ...prev,
      [stationCode]: [...new Set([...(prev[stationCode] || []), upperEmail])],
    }));
    setNewEmailInput((prev) => ({ ...prev, [stationCode]: "" }));
  };

  const handleRemoveEmailFromStation = (stationCode: string, emailToRemove: string) => {
    setStationEmails((prev) => ({
      ...prev,
      [stationCode]: (prev[stationCode] || []).filter((e) => e !== emailToRemove),
    }));
  };

  const handleDeleteStation = (stationCode: string) => {
    if (window.confirm(`${stationCode} istasyonunu silmek istediginize emin misiniz?`)) {
      setStationEmails((prev) => {
        const copy = { ...prev };
        delete copy[stationCode];
        return copy;
      });
    }
  };

  const handleAddFeeYear = () => {
    const years = Object.keys(appFees).map(Number).filter((y) => !isNaN(y));
    const nextYear = years.length > 0 ? Math.max(...years) + 1 : new Date().getFullYear();
    const nextYearStr = String(nextYear);
    if (!appFees[nextYearStr]) {
      const latestYearStr = String(Math.max(...years));
      setAppFees((prev) => ({
        ...prev,
        [nextYearStr]: prev[latestYearStr] ? { ...prev[latestYearStr] } : { yeniPermi: 6275, permiDegisiklik: 3135, ilaveCharter: 5020, charterDegisiklik: 2510 },
      }));
      setFeeYear(nextYearStr);
    }
  };

  const handleFeeChange = (type: string, value: string) => {
    setAppFees((prev) => ({
      ...prev,
      [feeYear]: {
        ...(prev[feeYear] || { yeniPermi: 6275, permiDegisiklik: 3135, ilaveCharter: 5020, charterDegisiklik: 2510 }),
        [type]: Number(value),
      },
    }));
  };

  // --- CALCULATION METRICS AND DATA STREAMS ---
  const getDevirGroups = useCallback(() => {
    const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const dayOfWeek = today.getDay();
    let daysToAdd = 1;
    if (dayOfWeek === 5) daysToAdd = 3;
    if (dayOfWeek === 6) daysToAdd = 2;
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + daysToAdd);
    const pendingFlights = flights.filter((f) => f && f.status === "APP_MADE" && !f.cancelled);
    const devirFlights = pendingFlights.filter((f) => {
      const fDate = parseDDMMYYYY(f.date);
      return fDate >= today && fDate <= maxDate;
    });
    const groups: Record<string, Flight[]> = {};
    devirFlights.forEach((f) => {
      const key = f.aftnNo || "AFTN BEKLIYOR";
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    });
    return groups;
  }, [flights, currentDate]);

  const parseDDMMYYYY = (dateStr: string): Date => {
    const parts = dateStr.split(".");
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), 0, 0, 0);
    }
    return new Date();
  };

  const devirGroupData = useMemo(() => getDevirGroups(), [getDevirGroups]);

  const sendDevirMail = () => {
    if (Object.keys(devirGroupData).length === 0) {
      alert("Devredilecek islem bulunmuyor.");
      return;
    }
    let bodyStr = "İyi çalışmalar,\n\n";
    bodyStr += "Aşagıda bilgileri yer alan seferler için SHGM izin basvuruları yapılmış ancak henuz yanıt alınamamıştır. İzinlerin takibi ve temini hususunda yardimlarınızı arz ederiz.\n\n";
    Object.entries(devirGroupData).forEach(([aftn, value]) => {
      bodyStr += `[AFTN: ${aftn}]\n`;
      const groupFlights = value as Flight[];
      groupFlights.forEach((f) => {
        bodyStr += `- ${f.al || "TK"}${f.flNo}   ${f.date}   ${f.orig}-${f.dest}\n`;
      });
      bodyStr += "\n";
    });
    bodyStr += "Saygılarımla.";
    const subject = "SHGM DEVİR - İzni Beklenen Seferler";
    const mailtoUrl = `mailto:COCC@THY.COM,FOCCOPSSLOT@THY.COM?cc=cargoslot@thy.com&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyStr)}`;
    triggerSafeMailto(mailtoUrl);
    setIsDevirModalOpen(false);
  };

  const navigateToOperations = (filterText: string) => {
    setCurrentView("OPERATIONS");
    setOperationsTab("ACTIVE");
    setSearchTerm(String(filterText || ""));
    setDestFilter("ALL");
    setDateFilter("");
    setStatusFilter("ALL");
  };

  const archivedSeqNumbers = useMemo(() => {
    const completedFlights = flights.filter((f) => f && (f.status === "APPROVED" || f.status === "REJECTED" || f.cancelled));
    const groups: Record<string, any> = {};
    completedFlights.forEach((f) => {
      const key = f.aftnNo ? String(f.aftnNo) : f.bulkId ? `BULK_${f.bulkId}` : `SINGLE_${f.id}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          timestamp: f.timestamps?.APP_MADE || f.timestamps?.APPROVED || f.timestamps?.REJECTED || f.timestamps?.CANCELLED || f.id || 0,
        };
      }
    });
    const sortedGroups = Object.values(groups).sort((a, b) => a.timestamp - b.timestamp);
    const seqMap: Record<string, number> = {};
    sortedGroups.forEach((g, index) => {
      seqMap[g.key] = index + 1;
    });
    return seqMap;
  }, [flights]);

  // --- CORE SYSTEM DATA STREAMS ---
  const unifiedGroups = useMemo(() => {
    const groups: Record<string, any> = {};
    const filteredFlights = flights.filter((f) => {
      if (!f) return false;
      const isCompleted = f.status === "APPROVED" || f.status === "REJECTED" || f.cancelled;
      if (operationsTab === "ACTIVE") {
        if (isCompleted) return false;
        if (statusFilter !== "ALL" && f.status !== statusFilter) return false;
        return true;
      } else {
        if (!isCompleted) return false;
        return true;
      }
    });

    const s = String(searchTerm || "").toLowerCase();
    let formattedDtS = "";
    if (dateFilter) {
      const [y, m, d] = String(dateFilter).split("-");
      formattedDtS = `${d}.${m}.${y}`;
    }

    filteredFlights.forEach((f) => {
      const matchDest = destFilter === "ALL" || String(f.dest || "") === destFilter;
      const matchSearch =
        String(f.flNo || "").toLowerCase().includes(s) ||
        String(f.date || "").includes(s) ||
        String(f.dest || "").toLowerCase().includes(s) ||
        String(f.aftnNo || "").toLowerCase().includes(s) ||
        String(f.awbNo || "").toLowerCase().includes(s);
      const matchDt = !formattedDtS || String(f.date || "").includes(formattedDtS);

      if (matchDest && matchSearch && matchDt) {
        const key = f.aftnNo ? String(f.aftnNo) : f.bulkId ? `BULK_${f.bulkId}` : `SINGLE_${f.id}`;
        if (!groups[key]) {
          groups[key] = {
            groupId: key,
            aftnNo: f.aftnNo || "",
            flights: [],
            timestamp: f.timestamps?.APPROVED || f.timestamps?.REJECTED || f.timestamps?.CANCELLED || f.timestamps?.APP_MADE || 0,
            appDate: f.timestamps?.APP_MADE || null,
            isBulk: false,
            status: f.status,
            hasSpecialDest: false,
          };
        }
        groups[key].flights.push(f);
        if (f.isBulk) groups[key].isBulk = true;
        if (f.timestamps?.APP_MADE && !groups[key].appDate) groups[key].appDate = f.timestamps.APP_MADE;
        if (SPECIAL_DESTINATIONS.includes(String(f.dest).toUpperCase())) groups[key].hasSpecialDest = true;
        if (f.status !== "APPROVED" && f.status !== "REJECTED" && !f.cancelled) {
          groups[key].status = f.status;
        } else if (f.status === "REJECTED") {
          groups[key].status = "REJECTED";
          groups[key].timestamp = f.timestamps?.REJECTED || groups[key].timestamp;
        }
      }
    });

    return Object.values(groups).sort((a: any, b: any) => {
      if (operationsTab === "ACTIVE") {
        const daysArrA = a.flights.map((f: any) => calculateDaysLeft(String(f.date || ""), currentDate));
        const minDaysA = daysArrA.length > 0 ? Math.min(...daysArrA) : 999;
        const daysArrB = b.flights.map((f: any) => calculateDaysLeft(String(f.date || ""), currentDate));
        const minDaysB = daysArrB.length > 0 ? Math.min(...daysArrB) : 999;
        return minDaysA - minDaysB;
      }
      return (b.timestamp || 0) - (a.timestamp || 0);
    });
  }, [flights, operationsTab, statusFilter, destFilter, searchTerm, dateFilter, currentDate]);

  const homePendingGroups = useMemo(() => {
    const groups: Record<string, any> = {};
    const pendingFlights = flights.filter((f) => f && f.status !== "APPROVED" && !f.cancelled && f.status !== "REJECTED");
    pendingFlights.forEach((f) => {
      const key = f.aftnNo ? String(f.aftnNo) : f.bulkId ? `BULK_${f.bulkId}` : `SINGLE_${f.id}`;
      if (!groups[key]) {
        groups[key] = {
          groupId: key,
          aftnNo: f.aftnNo || "AFTN BEKLIYOR",
          flights: [],
        };
      }
      groups[key].flights.push(f);
    });

    return Object.values(groups)
      .map((g: any) => {
        const daysArr = g.flights.map((f: any) => calculateDaysLeft(String(f.date || ""), currentDate));
        const minDays = daysArr.length > 0 ? Math.min(...daysArr) : 999;
        const uniqueFlNos = [...new Set(g.flights.map((f: any) => `${String(f.al || "TK")}${String(f.flNo || "")}`))];
        const uniqueStations = [...new Set(g.flights.map((f: any) => String(f.dest || "").trim()))].filter(Boolean);
        return { ...g, minDays, uniqueFlNos, uniqueStations };
      })
      .sort((a, b) => a.minDays - b.minDays);
  }, [flights, currentDate]);

  const destinations = useMemo(() => {
    return [...new Set(flights.map((f) => String(f?.dest || "").trim()))].filter(Boolean).sort();
  }, [flights]);

  // --- GRAPH METRICS GENERATORS ---
  const reportMetrics = useMemo(() => {
    const completedFlights = flights.filter((f) => f && f.timestamps?.APPROVED && f.timestamps?.APP_MADE && !f.cancelled);
    const pendingAftns = new Set(
      flights
        .filter((f) => f && f.status !== "APPROVED" && f.status !== "REJECTED" && !f.cancelled && f.aftnNo && String(f.aftnNo).trim() !== "")
        .map((f) => String(f.aftnNo).trim().toUpperCase())
    );
    const pendingApprovals = pendingAftns.size;
    let totalTime = 0;
    completedFlights.forEach((f) => {
      if (f.timestamps?.APPROVED && f.timestamps?.APP_MADE) {
        totalTime += f.timestamps.APPROVED - f.timestamps.APP_MADE;
      }
    });
    const avgHours = completedFlights.length > 0 ? totalTime / completedFlights.length / (1000 * 60 * 60) : 0;
    const avgFormat = avgHours > 24 ? `${(avgHours / 24).toFixed(1)} GUN` : `${avgHours.toFixed(1)} SAAT`;

    const allPricedFlights = flights.filter((f) => f && (f.status === "APPROVED" || f.status === "REJECTED") && !f.cancelled);

    const approvedAftns = new Set(
      flights.filter((f) => f.status === "APPROVED" && !f.cancelled && f.aftnNo).map((f) => String(f.aftnNo).trim().toUpperCase())
    );
    const totalApproved = approvedAftns.size;
    const totalSchedules = flights.filter((f) => f && String(f.orig || "").toUpperCase().startsWith("IST")).length;

    const cancelledCount = new Set(
      flights
        .filter((f) => f && f.cancelled)
        .map((f) => (f.aftnNo ? String(f.aftnNo).trim().toUpperCase() : f.bulkId ? `BULK_${f.bulkId}` : `SINGLE_${f.id}`))
    ).size;
    const rejectedCount = new Set(
      flights
        .filter((f) => f && f.status === "REJECTED")
        .map((f) => (f.aftnNo ? String(f.aftnNo).trim().toUpperCase() : f.bulkId ? `BULK_${f.bulkId}` : `SINGLE_${f.id}`))
    ).size;

    let calculatedCost = 0;
    const aftnMap = new Map();
    let emptyAftnCount = 0;

    allPricedFlights.forEach((f) => {
      const type = f.appType || "yeniPermi";
      const year = f.timestamps?.APP_MADE ? new Date(f.timestamps.APP_MADE).getFullYear().toString() : new Date().getFullYear().toString();
      if (f.aftnNo && String(f.aftnNo).trim() !== "") {
        const aftn = String(f.aftnNo).trim().toUpperCase();
        if (!aftnMap.has(aftn)) {
          aftnMap.set(aftn, { type, year });
        }
      } else {
        emptyAftnCount++;
        const feesForYear = appFees[year] || appFees[Object.keys(appFees).sort().pop() || "2026"] || INITIAL_FEES["2026"];
        calculatedCost += (feesForYear[type as any] as any) || 0;
      }
    });

    aftnMap.forEach((data) => {
      const feesForYear = appFees[data.year] || appFees[Object.keys(appFees).sort().pop() || "2026"] || INITIAL_FEES["2026"];
      calculatedCost += (feesForYear[data.type as any] as any) || 0;
    });

    const totalApplications = aftnMap.size + emptyAftnCount;
    const formattedCost = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(calculatedCost);
    return {
      totalApproved,
      avgApprovalTime: avgFormat,
      pendingApprovals,
      totalCost: formattedCost,
      totalApplications,
      totalSchedules,
      cancelledCount,
      rejectedCount,
    };
  }, [flights, appFees]);

  const monthlyAftnTrend = useMemo(() => {
    const months: Record<string, { aftns: Map<string, number> }> = {};
    flights.forEach((f) => {
      if (f && f.timestamps?.APP_MADE && f.aftnNo) {
        const d = new Date(f.timestamps.APP_MADE);
        if (!isNaN(d.getTime())) {
          const mY = `${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
          if (!months[mY]) months[mY] = { aftns: new Map() };
          const aftn = String(f.aftnNo).trim().toUpperCase();
          if (!months[mY].aftns.has(aftn)) {
            const year = d.getFullYear().toString();
            const type = f.appType || "yeniPermi";
            const feesForYear = appFees[year] || appFees[Object.keys(appFees).sort().pop() || "2026"] || INITIAL_FEES["2026"];
            const cost = (feesForYear[type as any] as any) || 0;
            months[mY].aftns.set(aftn, cost);
          }
        }
      }
    });
    const sortedKeys = Object.keys(months)
      .sort((a, b) => {
        const [mA, yA] = a.split(".");
        const [mB, yB] = b.split(".");
        if (yA !== yB) return Number(yA) - Number(yB);
        return Number(mA) - Number(mB);
      })
      .slice(-6);
    return sortedKeys.map((k) => {
      let totalCost = 0;
      months[k].aftns.forEach((cost) => (totalCost += cost));
      return { label: k, value: months[k].aftns.size, cost: totalCost };
    });
  }, [flights, appFees]);

  const stationDensity = useMemo(() => {
    const counts: Record<string, number> = {};
    flights.forEach((f) => {
      if (!f) return;
      const o = String(f.orig || "").toUpperCase();
      if (o && !o.startsWith("IST")) {
        counts[o] = (counts[o] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([k, v]) => ({ label: k, value: v }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [flights]);

  const weekdayAftnDensity = useMemo(() => {
    const counts: Record<string, number> = { PZT: 0, SAL: 0, CAR: 0, PER: 0, CUM: 0, CMT: 0, PAZ: 0 };
    const dayMap = ["PAZ", "PZT", "SAL", "CAR", "PER", "CUM", "CMT"];
    const processedAftns = new Set<string>();

    flights.forEach((f) => {
      if (f && f.aftnNo) {
        const aftn = String(f.aftnNo).trim().toUpperCase();
        if (!processedAftns.has(aftn)) {
          processedAftns.add(aftn);
          let dateToUse: Date | null = null;
          if (f.timestamps?.APP_MADE) {
            const d = new Date(f.timestamps.APP_MADE);
            if (!isNaN(d.getTime())) dateToUse = d;
          }
          if (!dateToUse && f.date) {
            const parts = String(f.date).split(".");
            if (parts.length === 3) dateToUse = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
          }
          if (dateToUse && !isNaN(dateToUse.getTime())) {
            const dayName = dayMap[dateToUse.getDay()];
            if (counts[dayName] !== undefined) counts[dayName]++;
          }
        }
      }
    });
    const days = ["PZT", "SAL", "CAR", "PER", "CUM", "CMT", "PAZ"];
    return days.map((d) => ({ label: d, value: counts[d] }));
  }, [flights]);

  const statusDistribution = useMemo(() => {
    const groups: Record<string, any> = {};
    flights.forEach((f) => {
      const key = f.aftnNo ? String(f.aftnNo).trim().toUpperCase() : f.bulkId ? `BULK_${f.bulkId}` : `SINGLE_${f.id}`;
      if (!groups[key]) {
        groups[key] = { status: f.status, cancelled: f.cancelled };
      }
    });
    let pending = 0,
      approved = 0,
      rejected = 0,
      cancelled = 0;
    Object.values(groups).forEach((g: any) => {
      if (g.cancelled) cancelled++;
      else if (g.status === "REJECTED") rejected++;
      else if (g.status === "APPROVED") approved++;
      else pending++;
    });
    return [
      { label: "Bekleyen", value: pending, color: "bg-blue-500" },
      { label: "Onayli", value: approved, color: "bg-emerald-500" },
      { label: "Reddedildi", value: rejected, color: "bg-red-500" },
      { label: "Iptal", value: cancelled, color: "bg-orange-500" },
    ].filter((x) => x.value > 0);
  }, [flights]);

  const filteredStationsForSettings = useMemo(() => {
    return Object.keys(stationEmails)
      .filter((code) => String(code).includes(String(settingsSearch || "").toUpperCase()))
      .sort();
  }, [stationEmails, settingsSearch]);

  const renderWorkflowStepper = (group: any) => {
    const isSpecial =
      group.hasSpecialDest || 
      (group.flights && group.flights.some((f: Flight) => SPECIAL_DESTINATIONS.includes(String(f.dest || "").toUpperCase())));
    const currentWorkflow = isSpecial ? SPECIAL_WORKFLOW : STANDARD_WORKFLOW;
    const flowKeys = ["PENDING", ...currentWorkflow.map((w) => w.key)];
    let curIdx = flowKeys.indexOf(String(group.status || ""));
    if (curIdx === -1) curIdx = 0;

    return (
      <div className="flex items-center justify-center relative w-full px-2 py-3 mt-auto">
        <div className="absolute top-1/2 left-6 right-6 h-[3px] bg-zinc-900 -translate-y-1/2 z-0" />
        <div className="flex justify-between w-full z-10 relative">
          {currentWorkflow.map((step) => {
            const stepIdx = flowKeys.indexOf(step.key);
            const isComp = curIdx >= stepIdx;
            const isNext = curIdx === stepIdx - 1;
            const isCurrentPending = curIdx === stepIdx;
            let btnStyle = "bg-white border-2 border-zinc-900 text-zinc-400";
            if (isComp) btnStyle = "bg-amber-300 border-2 border-zinc-900 text-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]";
            else if (isNext) btnStyle = "bg-rose-400 border-2 border-zinc-950 text-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] scale-110";
            return (
              <div key={step.key} className="relative flex justify-center group/btn">
                <span className="absolute -top-10 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-zinc-900 text-white text-[9px] font-mono uppercase font-bold tracking-wider px-2 py-1 rounded-md border border-zinc-800 whitespace-nowrap pointer-events-none z-20 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {String(step.line1)} {String(step.line2)}
                </span>
                <button
                  type="button"
                  onClick={() => handleStatusClick(group, step.key)}
                  disabled={!isNext && !isComp && !isCurrentPending}
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all focus:outline-none ${btnStyle} ${
                    !isNext && !isComp && !isCurrentPending ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:scale-105 active:scale-95"
                  }`}
                >
                  {isComp ? <Check size={14} strokeWidth={3} className="text-zinc-950" /> : <step.icon size={12} strokeWidth={2.5} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSaveStatusBadge = () => {
    let cfg = { color: "text-emerald-500", bg: "bg-emerald-50 border-emerald-100", label: "Kaydedildi" };
    return (
      <div className={`flex items-center gap-1.5 ${cfg.bg} ${cfg.color} border px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide`}>
        <Check size={12} strokeWidth={2.5} />
        <span>{cfg.label}</span>
      </div>
    );
  };

  const renderGoogleSyncBadge = () => {
    const cfg = {
      idle: {
        color: "text-blue-500",
        bg: "bg-blue-50 border-blue-100",
        label: lastSyncTime
          ? `${lastSyncTime.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`
          : "G.Sheets Bağlı",
      },
      loading: { color: "text-blue-600", bg: "bg-blue-50 border-blue-200", label: "Güncelleniyor..." },
      saving: { color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-105", label: "Kaydediliyor..." },
      success: { color: "text-emerald-500", bg: "bg-emerald-50 border-emerald-100", label: "Senkronize!" },
      error: { color: "text-red-500", bg: "bg-red-50 border-red-100", label: "Sheets Hatası" },
    }[googleSyncStatus];

    return (
      <button
        onClick={handleGoogleFullSync}
        title="Google Sheets Çift Yönlü Senkronizasyonu Başlat"
        className={`flex items-center gap-1.5 ${cfg.bg} ${cfg.color} border px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all hover:brightness-95 active:scale-95 cursor-pointer outline-none`}
      >
        {googleSyncStatus === "loading" || googleSyncStatus === "saving" ? (
          <Loader size={12} className="animate-spin" />
        ) : (
          <TableIcon size={12} />
        )}
        <span>{cfg.label}</span>
      </button>
    );
  };

  const isAftnModalSafe = isAftnModalOpen && selectedFlightForAftn && selectedFlightForAftn.flights;
  const aftnDisplayFlight = isAftnModalSafe
    ? selectedFlightForAftn.flights[0]
    : selectedFlightForAftn && !selectedFlightForAftn.flights
    ? selectedFlightForAftn
    : null;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 pb-20 relative selection:bg-red-100">
      {/* HEADER */}
      <header className="bg-white border-b-2 border-zinc-900 sticky top-0 z-40 h-20 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#C8102E] border-2 border-zinc-900 p-1.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] flex items-center justify-center">
              <Plane className="h-5 w-5 text-white transform -rotate-45" strokeWidth={3} />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-[15px] font-black leading-tight tracking-tight uppercase italic text-zinc-900">SHGM Takip Engine</h1>
              <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider leading-none">v5.6.2 • PRODUCTION READY</p>
            </div>
          </div>
          <div className="hidden md:flex bg-zinc-100 p-1 rounded-xl border-2 border-zinc-900">
            {[
              { key: "HOME", label: "Anasayfa" },
              { key: "OPERATIONS", label: "Operasyon Masasi" },
              { key: "REPORTING", label: "Raporlama" },
              { key: "SETTINGS", label: "Ayarlar" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => {
                  setCurrentView(key);
                  setStatusFilter("ALL");
                  setDestFilter("ALL");
                  setSearchTerm("");
                  setDateFilter("");
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all duration-200 ${
                  currentView === key ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="md:hidden flex bg-zinc-100 p-1 rounded-lg border-2 border-zinc-900">
            <button
              onClick={() => setCurrentView("HOME")}
              className={`p-2 rounded ${currentView === "HOME" ? "bg-zinc-900 text-white" : "text-zinc-650"}`}
            >
              <Home size={16} />
            </button>
            <button
              onClick={() => setCurrentView("OPERATIONS")}
              className={`p-2 rounded ${currentView === "OPERATIONS" ? "bg-zinc-900 text-white" : "text-zinc-650"}`}
            >
              <LayoutDashboard size={16} />
            </button>
            <button
              onClick={() => setCurrentView("SETTINGS")}
              className={`p-2 rounded ${currentView === "SETTINGS" ? "bg-zinc-900 text-white" : "text-zinc-650"}`}
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-8">
        {/* --- ANASAYFA --- */}
        {currentView === "HOME" && (
          <div className="animate-fade-in space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight uppercase italic text-zinc-950">Sisteme Hos Geldiniz</h2>
                <p className="text-xs text-zinc-500 font-mono uppercase tracking-wide mt-1">Onayi henuz gelmeyen tum sureclerin (AFTN & Tekil) bento ozeti.</p>
              </div>
              <button
                onClick={() => setIsDevirModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-300 hover:bg-amber-400 text-zinc-900 border-2 border-zinc-900 rounded-xl text-xs font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer"
              >
                <BellRing size={16} /> DEVIR MAILI HAZIRLA
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-5 rounded-2xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between h-36 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider font-mono">Onay Bekleyen</span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono mt-1">AFTN SAYISI</span>
                  </div>
                  <UploadCloud className="text-orange-500 shrink-0" size={20} />
                </div>
                <div className="text-4xl font-extrabold italic text-zinc-900 font-mono leading-none tracking-tighter">{reportMetrics.pendingApprovals}</div>
              </div>
              <div className="bg-rose-50 p-5 rounded-2xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between h-36 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-zinc-550 text-[10px] font-bold uppercase tracking-wider font-mono">Reddedilen</span>
                    <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider font-mono mt-1">AFTN SAYISI</span>
                  </div>
                  <Ban className="text-red-500 shrink-0" size={20} />
                </div>
                <div className="text-4xl font-extrabold italic text-zinc-900 font-mono leading-none tracking-tighter">{reportMetrics.rejectedCount}</div>
              </div>
              <div className="bg-amber-50 p-5 rounded-2xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between h-36 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-zinc-550 text-[10px] font-bold uppercase tracking-wider font-mono">Iptal Edilen</span>
                    <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider font-mono mt-1">AFTN SAYISI</span>
                  </div>
                  <XCircle className="text-amber-600 shrink-0" size={20} />
                </div>
                <div className="text-4xl font-extrabold italic text-zinc-900 font-mono leading-none tracking-tighter">{reportMetrics.cancelledCount}</div>
              </div>
              <div className="bg-emerald-50 p-5 rounded-2xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between h-36 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-zinc-550 text-[10px] font-bold uppercase tracking-wider font-mono">Toplam Onaylanan</span>
                    <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider font-mono mt-1">AFTN SAYISI</span>
                  </div>
                  <CheckCircle className="text-emerald-500 shrink-0" size={20} />
                </div>
                <div className="text-4xl font-extrabold italic text-zinc-900 font-mono leading-none tracking-tighter">{reportMetrics.totalApproved}</div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-950 mb-4 border-b-2 border-zinc-900 pb-2">
                Aktif Bekleyen Surecler
              </h3>
              {homePendingGroups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {homePendingGroups.map((app) => (
                    <div
                      key={app.groupId}
                      onClick={() => navigateToOperations(app.aftnNo !== "AFTN BEKLIYOR" ? app.aftnNo : app.uniqueFlNos[0])}
                      className="bg-white p-5 rounded-2xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] cursor-pointer hover:shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all relative overflow-hidden group flex flex-col h-full"
                    >
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                          app.minDays <= 3 ? "bg-red-500" : app.minDays <= 7 ? "bg-amber-400" : "bg-indigo-500"
                        }`}
                      />
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-zinc-100 border border-zinc-950 text-zinc-900 p-1.5 rounded-lg flex items-center justify-center">
                            <FileDigit size={16} />
                          </div>
                          <span className="font-mono font-bold text-zinc-900 text-lg truncate" title={app.aftnNo}>
                            {app.aftnNo}
                          </span>
                        </div>
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded border-2 border-zinc-900 text-[10px] font-black uppercase tracking-wider ${
                            app.minDays <= 3
                              ? "bg-red-100 text-red-950"
                              : app.minDays <= 7
                              ? "bg-amber-100 text-amber-950"
                              : "bg-indigo-100 text-indigo-950"
                          }`}
                        >
                          {app.minDays < 0 ? "GECTI" : `${app.minDays} GUN KALDI`}
                        </span>
                      </div>
                      <div className="space-y-4 mb-4 flex-1">
                        <div>
                          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                            Seferler ({app.uniqueFlNos.length})
                          </div>
                          <div className="text-sm font-bold text-zinc-800">
                            {app.uniqueFlNos.slice(0, 5).join(", ")}
                            {app.uniqueFlNos.length > 5 ? <span className="text-zinc-500 italic"> +{app.uniqueFlNos.length - 5}</span> : ""}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                            Istasyonlar ({app.uniqueStations.length})
                          </div>
                          <div className="text-sm font-bold text-zinc-800">
                            {app.uniqueStations.slice(0, 5).join(", ")}
                            {app.uniqueStations.length > 5 ? (
                              <span className="text-zinc-500 italic"> +{app.uniqueStations.length - 5}</span>
                            ) : (
                              ""
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="pt-3 border-t-2 border-zinc-900 flex justify-between items-center mt-auto">
                        <span className="text-xs text-zinc-500 font-mono font-bold">{app.flights.length} Ucus Iceriyor</span>
                        <span className="text-[10px] font-black uppercase text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          Incele <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-12 rounded-3xl border-2 border-zinc-900 border-dashed text-center flex flex-col items-center justify-center shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
                  <CheckCircle size={40} className="text-emerald-400 mb-3" />
                  <p className="text-zinc-600 font-bold uppercase tracking-wider text-xs">Harika! Onay bekleyen hicbir basvuru bulunmuyor.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- OPERASYON MASASI --- */}
        {currentView === "OPERATIONS" && (
          <div className="animate-fade-in space-y-6">
            <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 border-2 border-zinc-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] items-center">
              <div className="flex bg-zinc-150 p-1 rounded-xl border-2 border-zinc-900 w-full lg:w-auto shrink-0 font-bold">
                <button
                  onClick={() => setOperationsTab("ACTIVE")}
                  className={`flex-1 lg:px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${
                    operationsTab === "ACTIVE" ? "bg-zinc-900 text-white" : "text-zinc-650 hover:bg-zinc-200/55"
                  }`}
                >
                  Devam Edenler
                </button>
                <button
                  onClick={() => {
                    setOperationsTab("COMPLETED");
                    setStatusFilter("ALL");
                  }}
                  className={`flex-1 lg:px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${
                    operationsTab === "COMPLETED" ? "bg-zinc-900 text-white" : "text-zinc-650 hover:bg-zinc-200/55"
                  }`}
                >
                  Arsiv
                </button>
              </div>
              <div className="hidden lg:block w-[2px] h-8 bg-zinc-900" />
              <div className="flex-1 flex gap-3 w-full flex-wrap">
                <div className="relative flex-1 min-w-[150px] border-2 border-zinc-900 rounded-xl px-3 py-1.5 bg-white">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="AFTN, AWB veya Sefer..."
                    className="w-full pl-7 pr-1 text-xs focus:outline-none placeholder-zinc-400 text-zinc-800 font-bold uppercase"
                  />
                </div>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border-2 border-zinc-900 rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none text-zinc-700"
                />
                <select
                  value={destFilter}
                  onChange={(e) => setDestFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border-2 border-zinc-900 rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none text-zinc-700 appearance-none pr-8 cursor-pointer"
                >
                  <option value="ALL">Tum Istasyonlar</option>
                  {destinations.map((d) => (
                    <option key={d} value={d}>
                      {String(d)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hidden lg:block w-[2px] h-8 bg-zinc-900" />
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="w-full lg:w-auto px-5 py-2.5 bg-[#C8102E] text-white border-2 border-zinc-900 rounded-xl text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] hover:bg-red-700 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus size={16} /> YENI BASVURU
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 w-full">
              {unifiedGroups.length > 0 ? (
                unifiedGroups.map((group: any) => {
                  const isBulkGroup = group.isBulk || (group.flights && group.flights.length > 1);
                  const isCancelled = group.flights && group.flights[0] && group.flights[0].cancelled;
                  const isRejected = group.status === "REJECTED";
                  const isPending = group.status !== "APPROVED" && !isCancelled && !isRejected;
                  const isSpecial =
                    group.hasSpecialDest ||
                    (group.flights && group.flights.some((f: any) => SPECIAL_DESTINATIONS.includes(String(f.dest || "").toUpperCase())));
                  const daysArr = (group.flights || []).map((f: any) => calculateDaysLeft(String(f.date || ""), currentDate));
                  const minDays = daysArr.length > 0 ? Math.min(...daysArr) : 999;
                  const isUrgent = isPending && minDays <= 3;
                  const isWarning = isPending && minDays > 3 && minDays <= 7;
                  const isPast = isPending && minDays < 0;
                  let borderClass = isCancelled
                    ? "border-orange-200"
                    : isRejected
                    ? "border-red-200"
                    : isSpecial
                    ? "border-amber-300 ring-2 ring-amber-100"
                    : isUrgent
                    ? "border-red-200"
                    : isWarning
                    ? "border-orange-200"
                    : "border-gray-200";
                  let headerBg = isCancelled ? "bg-orange-50/50" : isRejected ? "bg-red-50/50" : isSpecial ? "bg-amber-50" : "bg-gray-50/50";
                  let rowBgClass = isCancelled ? "bg-orange-50/40" : isRejected ? "bg-red-50/30" : "";
                  let statusPill = null;
                  if (isCancelled)
                    statusPill = (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-[10px] font-bold tracking-wide">IPTAL</span>
                    );
                  else if (isRejected)
                    statusPill = (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-[10px] font-bold tracking-wide">REDDEDILDI</span>
                    );
                  else if (!isPending)
                    statusPill = (
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold tracking-wide">ONAYLANDI</span>
                    );
                  else if (isPast)
                    statusPill = (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-[10px] font-bold tracking-wide">GECTI</span>
                    );
                  else
                    statusPill = (
                      <span
                        className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide ${
                          isUrgent ? "bg-red-100 text-[#C8102E]" : "bg-blue-50 text-blue-600 border border-blue-100"
                        }`}
                      >
                        {minDays} GUN KALDI
                      </span>
                    );

                  let title = "";
                  if (isSpecial && group.flights && group.flights[0]) {
                    title = String(group.flights[0].dest || "").toUpperCase() + " BASVURUSU";
                  } else if (group.flights && group.flights[0]) {
                    const dateRawStr = String(group.flights[0].date || "");
                    title = dateRawStr.includes("-") || dateRawStr.includes(" ") ? "DONEMSEL DEGISIKLIK" : "MUNFERIT DEGISIKLIK";
                  }

                  return (
                    <div
                      key={group.groupId}
                      className={`bg-white rounded-2xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] hover:shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all flex flex-col overflow-hidden h-full min-h-[310px] ${rowBgClass}`}
                    >
                      {/* HEADER */}
                      <div className={`p-4 border-b-2 border-zinc-900 flex justify-between items-center shrink-0 ${headerBg}`}>
                        <div
                          className="font-mono font-black text-sm text-zinc-900 tracking-tight truncate pr-2 flex items-center"
                          title={String(group.aftnNo || "TEKIL UCUS")}
                        >
                          {operationsTab === "COMPLETED" && archivedSeqNumbers[group.groupId] && (
                            <span className="text-xs font-bold text-zinc-500 mr-2 hover:text-zinc-900 transition-colors bg-zinc-200/60 px-1.5 py-0.5 rounded border border-zinc-400">
                              #{archivedSeqNumbers[group.groupId]}
                            </span>
                          )}
                          {String(group.aftnNo || "TEKIL UCUS")}
                        </div>
                        {statusPill}
                      </div>
                      {/* BODY */}
                      <div className="p-4 flex-1 flex flex-col relative bg-white">
                        {isSpecial && group.flights[0]?.awbNo && (
                          <div className="mb-3">
                            <span className="inline-flex items-center gap-1.5 bg-amber-200 text-zinc-900 px-2.5 py-1 rounded-lg text-[10px] font-black border-2 border-zinc-900 font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                              <Radiation size={12} /> DG / AWB: {group.flights[0].awbNo}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-extrabold text-zinc-900 text-sm tracking-tight uppercase italic font-mono">{title}</div>
                        </div>
                        <div className="mb-auto">
                          {isBulkGroup ? (
                            <div className="text-xs text-zinc-650 leading-relaxed mt-2 font-medium">
                              <span className="font-bold text-zinc-800 block mb-1 uppercase font-mono text-[10px] tracking-wider">{group.flights?.length || 0} Ucus Iceriyor:</span>
                              {group.flights.slice(0, 4).map((f: any) => `${String(f.al || "TK")}${f.flNo}`).join(", ")}
                              {group.flights.length > 4 ? (
                                <span className="text-zinc-400 italic"> ve {group.flights.length - 4} daha...</span>
                              ) : (
                                ""
                              )}
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between items-center relative py-2 mb-1">
                                <div className="text-2xl font-black text-zinc-900 font-mono bg-zinc-100 border-2 border-zinc-900 px-2.5 py-0.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{String(group.flights[0]?.orig || "")}</div>
                                <div className="flex-1 flex items-center px-4">
                                  <div className="w-full h-[2px] border-b-2 border-dashed border-zinc-900 relative">
                                    <Plane
                                      className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-zinc-900 bg-white border-2 border-zinc-900 p-0.5 rounded-md"
                                      size={22}
                                    />
                                  </div>
                                </div>
                                <div className="text-2xl font-black text-zinc-900 font-mono bg-zinc-100 border-2 border-zinc-900 px-2.5 py-0.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{String(group.flights[0]?.dest || "")}</div>
                              </div>
                              <div className="flex justify-between items-center text-xs font-bold text-zinc-500 font-mono mt-1">
                                <span>{String(group.flights[0]?.date || "")}</span>
                                <span className="bg-zinc-100 border border-zinc-300 px-1 py-0.5 rounded">
                                  {String(group.flights[0]?.std || "")} - {String(group.flights[0]?.sta || "")}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                        {/* STEPPER */}
                        <div className="mt-4 pt-2">{renderWorkflowStepper(group)}</div>
                      </div>
                      {/* FOOTER ACTIONS */}
                      <div className="p-3 border-t-2 border-zinc-900 bg-zinc-50 flex justify-between items-center gap-1 shrink-0">
                        <div className="flex gap-1">
                          {isPending && (
                            <>
                              <button
                                onClick={() => approveArchiveGroup(group.groupId)}
                                className="p-2 border border-zinc-300 hover:border-zinc-900 text-zinc-500 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                                title="Onay Ver"
                              >
                                <CheckCircle size={15} />
                              </button>
                              <button
                                onClick={() => rejectGroupAndClone(group.groupId)}
                                className="p-2 border border-zinc-300 hover:border-zinc-900 text-zinc-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                                title="Reddedildi"
                              >
                                <Ban size={15} />
                              </button>
                            </>
                          )}
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedArchiveGroup(group);
                              setIsArchiveDetailModalOpen(true);
                            }}
                            className="p-2 border border-zinc-300 hover:border-zinc-900 text-zinc-550 hover:text-indigo-700 hover:bg-indigo-100 rounded-lg transition-all cursor-pointer"
                            title="Incele"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => openEditModal(group)}
                            className="p-2 border border-zinc-300 hover:border-zinc-900 text-zinc-550 hover:text-amber-700 hover:bg-amber-100 rounded-lg transition-all cursor-pointer"
                            title="Duzenle"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => resetGroup(group.groupId)}
                            className="p-2 border border-zinc-300 hover:border-zinc-900 text-zinc-550 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg transition-all cursor-pointer"
                            title="Sifirla"
                          >
                            <RefreshCw size={14} />
                          </button>
                          <button
                            onClick={() => cancelGroup(group.groupId)}
                            className="p-2 border border-zinc-300 hover:border-zinc-900 text-zinc-550 hover:text-orange-700 hover:bg-orange-100 rounded-lg transition-all cursor-pointer"
                            title="Iptal"
                          >
                            <XCircle size={14} />
                          </button>
                          <button
                            onClick={() => deleteGroup(group.groupId)}
                            className="p-2 border border-zinc-300 hover:border-zinc-900 text-zinc-550 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all cursor-pointer"
                            title="Sil"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-24 bg-white rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                  <LayoutDashboard size={48} className="mb-4 text-gray-300" />
                  <p className="text-sm font-medium">Bu kriterlerde bir operasyon kaydi bulunamadi.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- RAPORLAMA --- */}
        {currentView === "REPORTING" && (
          <ReportingView
            reportMetrics={reportMetrics}
            monthlyAftnTrend={monthlyAftnTrend}
            stationDensity={stationDensity}
            statusDistribution={statusDistribution}
            weekdayAftnDensity={weekdayAftnDensity}
          />
        )}

        {/* --- AYARLAR --- */}
        {currentView === "SETTINGS" && (
          <SettingsView
            settingsTab={settingsTab}
            setSettingsTab={setSettingsTab}
            stationEmails={stationEmails}
            setStationEmails={setStationEmails}
            appFees={appFees}
            setAppFees={setAppFees}
            feeYear={feeYear}
            setFeeYear={setFeeYear}
            settingsSearch={settingsSearch}
            setSettingsSearch={setSettingsSearch}
            newStationCode={newStationCode}
            setNewStationCode={setNewStationCode}
            newStationEmail={newStationEmail}
            setNewStationEmail={setNewStationEmail}
            newEmailInput={newEmailInput}
            setNewEmailInput={setNewEmailInput}
            filteredStationsForSettings={filteredStationsForSettings}
            handleAddStation={handleAddStation}
            handleAddEmailToStation={handleAddEmailToStation}
            handleRemoveEmailFromStation={handleRemoveEmailFromStation}
            handleDeleteStation={handleDeleteStation}
            handleAddFeeYear={handleAddFeeYear}
            handleFeeChange={handleFeeChange}
            manualDownload={manualDownload}
            importInputRef={importInputRef}
            importFromJson={importFromJson}
            clearAllData={clearAllData}
            
            googleSheetsUrl={googleSheetsUrl}
            setGoogleSheetsUrl={setGoogleSheetsUrl}
            googleAppsScriptUrl={googleAppsScriptUrl}
            setGoogleAppsScriptUrl={setGoogleAppsScriptUrl}
            googleSyncStatus={googleSyncStatus}
            lastSyncTime={lastSyncTime}
            autoSyncEnabled={autoSyncEnabled}
            setAutoSyncEnabled={setAutoSyncEnabled}
            handleGooglePull={() => handleGooglePull(false)}
            handleGooglePush={handleGooglePush}
            handleGoogleFullSync={handleGoogleFullSync}
          />
        )}
      </main>

      {/* --- ALL FLOW DIALOGS & MODALS --- */}

      {/* NOBET DEVİR MAİL MODAL */}
      <DevirModal
        isOpen={isDevirModalOpen}
        onClose={() => setIsDevirModalOpen(false)}
        devirGroupData={devirGroupData}
        onSendMail={sendDevirMail}
      />

      {/* BACKUP REMINDER DIALOG */}
      {isBackupReminderOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center border border-gray-100">
            <div className="bg-amber-50 text-amber-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <TableIcon size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Veri Yedekleme Hatirlaticisi</h3>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed font-semibold">
              Sisteme giris yaptiginizdan beri 30 dakika gecti. Olasi tarayici temizliklerinde veri kaybini onlemek icin guncel verilerinizi yedeklemenizi tavsiye ederiz.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setIsBackupReminderOpen(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold transition-colors"
              >
                Daha Sonra
              </button>
              <button
                onClick={() => {
                  manualDownload();
                  setIsBackupReminderOpen(false);
                }}
                className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <Download size={14} /> Simdi Yedekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* YENİ PLAN EKLEME DIALOG */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-5 flex justify-between items-center border-b border-gray-100 shrink-0">
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    addMode === "SINGLE" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                  }`}
                  onClick={() => setAddMode("SINGLE")}
                >
                  Tekli Ekle
                </button>
                <button
                  type="button"
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    addMode === "BULK" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                  }`}
                  onClick={() => setAddMode("BULK")}
                >
                  Toplu (Excel)
                </button>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setDashboardPasteContent("");
                  setDashboardParsedData([]);
                  setAddMode("SINGLE");
                }}
                className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
              <form onSubmit={handleDashboardSubmit} className="space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-4">
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-2">Basvuru Turu Kapsami</label>
                  <select
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-gray-300 font-medium"
                    value={dashboardAppType}
                    onChange={(e) => setDashboardAppType(e.target.value)}
                  >
                    {APP_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                {addMode === "SINGLE" && (
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1.5">Sefer No</label>
                        <input
                          type="text"
                          required
                          placeholder="1920"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-gray-300 font-semibold"
                          value={newFlight.flNo}
                          onChange={(e) => setNewFlight({ ...newFlight, flNo: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1.5">Tarih</label>
                        <input
                          type="text"
                          required
                          placeholder="04.05.2026"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-gray-300 font-semibold"
                          value={newFlight.date}
                          onChange={(e) => setNewFlight({ ...newFlight, date: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1.5">Kalkis</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm uppercase focus:outline-none focus:bg-white focus:border-gray-300 font-semibold"
                          value={newFlight.orig}
                          onChange={(e) => setNewFlight({ ...newFlight, orig: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1.5">Varis</label>
                        <input
                          type="text"
                          required
                          placeholder="EBL"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm uppercase focus:outline-none focus:bg-white focus:border-gray-300 font-semibold"
                          value={newFlight.dest}
                          onChange={(e) => setNewFlight({ ...newFlight, dest: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1.5">Kalkis (UTC)</label>
                        <input
                          type="time"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-gray-300 font-medium"
                          value={newFlight.std}
                          onChange={(e) => setNewFlight({ ...newFlight, std: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1.5">Varis (UTC)</label>
                        <input
                          type="time"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-gray-300 font-medium"
                          value={newFlight.sta}
                          onChange={(e) => setNewFlight({ ...newFlight, sta: e.target.value })}
                        />
                      </div>
                    </div>
                    {SPECIAL_DESTINATIONS.includes(String(newFlight.dest).toUpperCase()) && (
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl mt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Radiation className="text-orange-500" size={16} />
                          <span className="text-xs font-bold text-orange-800 uppercase">Ozel Istasyon (AWB / DG Gereksinimi)</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-semibold text-orange-700 uppercase mb-1.5">AWB Numarasi</label>
                            <input
                              type="text"
                              placeholder="235-..."
                              className="w-full px-3 py-2 bg-white border border-orange-200 rounded-lg text-sm focus:outline-none focus:border-orange-400 font-medium"
                              value={newFlight.awbNo || ""}
                              onChange={(e) => setNewFlight({ ...newFlight, awbNo: e.target.value })}
                            />
                          </div>
                          <div className="flex items-center pt-5">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 border-orange-300"
                                checked={newFlight.isDg || false}
                                onChange={(e) => setNewFlight({ ...newFlight, isDg: e.target.checked })}
                              />
                              <span className="text-xs font-semibold text-orange-800">DG Gonderi Basvurusu</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {addMode === "BULK" && (
                  <div className="flex flex-col gap-4">
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 flex items-start gap-2 leading-relaxed">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <p>
                        Toplu eklemede AWB/DG girisleri desteklenmez. Ozel istasyonlara (BGW, EBL, vb.) AWB eklemek icin ucalarin yukleme
                        bileseni sonrasinda "Duzenle" menusunu kullanabilirsiniz.
                      </p>
                    </div>
                    <div className="flex flex-col h-40">
                      <textarea
                        className="w-full h-full p-4 border border-gray-200 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-100 font-mono text-xs whitespace-pre resize-none shadow-sm"
                        placeholder="Excel'den kopyaladiginiz tarife blogunu buraya yapistirin..."
                        value={dashboardPasteContent}
                        onChange={handleDashboardPaste}
                      ></textarea>
                    </div>
                    {dashboardParsedData.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-2xl p-2 text-xs max-h-40 overflow-y-auto shadow-sm">
                        <table className="w-full text-left">
                          <thead className="bg-gray-50/50 text-gray-500 font-semibold">
                            <tr>
                              <th className="p-2">Sefer</th>
                              <th className="p-2">Tarih</th>
                              <th className="p-2">Parkur</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dashboardParsedData.map((f, i) => (
                              <tr key={i} className="border-t border-gray-5">
                                <td className="p-2">
                                  {f.al || "TK"}
                                  {f.flNo || ""}
                                </td>
                                <td className="p-2">{f.date || ""}</td>
                                <td className="p-2 font-semibold text-gray-750">
                                  {f.orig || ""}-{f.dest || ""}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
                <button id="hidden-submit-btn" type="submit" className="hidden"></button>
              </form>
            </div>
            <div className="p-5 border-t border-gray-100 bg-white flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setDashboardPasteContent("");
                  setDashboardParsedData([]);
                  setAddMode("SINGLE");
                }}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-sm font-medium transition"
              >
                Iptal
              </button>
              <button
                onClick={() => document.getElementById("hidden-submit-btn")?.click()}
                disabled={addMode === "BULK" && dashboardParsedData.length === 0}
                className={`px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium transition shadow-sm ${
                  addMode === "BULK" && dashboardParsedData.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"
                }`}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DÜZENLEME DIALOG */}
      <EditGroupModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editGroupData={editGroupData}
        setEditGroupData={setEditGroupData}
        onSave={saveEditGroup}
        APP_TYPES={APP_TYPES}
      />

      {/* AFTN GİRİŞ MODAL */}
      {isAftnModalOpen && selectedFlightForAftn && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-5 flex justify-between items-center border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">AFTN Giriniz</h2>
              <button onClick={() => setIsAftnModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAftnSubmit} className="p-6">
              <div className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 mb-5">
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-1">Islem yapilan ucus</p>
                <p className="font-semibold text-sm text-gray-900">
                  {aftnDisplayFlight
                    ? `${String(aftnDisplayFlight.al || "TK")}${String(aftnDisplayFlight.flNo || "")} ${String(
                        aftnDisplayFlight.dest || ""
                      )} • ${String(aftnDisplayFlight.date || "")}`
                    : "TOPLU BASVURU"}
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Basvuru Turu</label>
                <select
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm font-semibold"
                  value={aftnAppType}
                  onChange={(e) => setAftnAppType(e.target.value)}
                >
                  {APP_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">AFTN Numarasi</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Orn: LTBAKT"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 text-base font-mono uppercase tracking-widest font-semibold text-gray-800"
                  value={aftnInput || ""}
                  onChange={(e) => setAftnInput(String(e.target.value).toUpperCase())}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAftnModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-sm font-medium transition"
                >
                  Iptal
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-[#C8102E] hover:bg-red-700 text-white rounded-xl text-sm font-medium transition shadow-sm">
                  Basvur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MAİL HAZIRLAMA VE ÖNİZLEME MODAL */}
      <MailPreviewModal
        isOpen={isMailModalOpen}
        onClose={() => setIsMailModalOpen(false)}
        selectedFlightForMail={selectedFlightForMail}
        excelPasteContent={excelPasteContent}
        onExcelPasteChange={handleExcelPaste}
        parsedTableData={parsedTableData}
        calculatedRecipients={calculatedRecipients}
        onSendEmail={sendEmail}
        formatForMail={formatForMail}
        SPECIAL_DESTINATIONS={SPECIAL_DESTINATIONS}
      />

      {/* ARSİV DETAY MODAL */}
      {isArchiveDetailModalOpen && selectedArchiveGroup && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-5 flex justify-between items-center border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Basvuru Grubu Detayi</h2>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{String(selectedArchiveGroup.aftnNo || "")}</p>
              </div>
              <button
                onClick={() => setIsArchiveDetailModalOpen(false)}
                className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-gray-50/50 justify-between">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Sefer</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tarih</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Parkur</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Kapsam</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selectedArchiveGroup.flights.map((f: Flight) => (
                      <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-3 font-semibold text-gray-900">
                          {String(f.al || "TK")}
                          {String(f.flNo || "")}
                        </td>
                        <td className="px-6 py-3 text-gray-600 font-semibold">
                          {String(f.date || "")} <span className="text-gray-400 text-xs ml-1">({String(f.day || "")})</span>
                        </td>
                        <td className="px-6 py-3 font-semibold text-gray-800">
                          {String(f.orig || "")}-{String(f.dest || "")}
                        </td>
                        <td className="px-6 py-3">
                          {String(f.orig || "").startsWith("IST") ? (
                            <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold">TARIFE</span>
                          ) : (
                            <span className="text-gray-300 font-medium">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 bg-white flex justify-between items-center shrink-0">
              <span className="text-xs font-semibold text-gray-500">
                Toplam: {selectedArchiveGroup.flights.length} Kayit | Tarife Sayisi:{" "}
                {selectedArchiveGroup.flights.filter((f: Flight) => String(f.orig || "").startsWith("IST")).length}
              </span>
              <button
                onClick={() => setIsArchiveDetailModalOpen(false)}
                className="px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-850 transition shadow-sm px-6"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER BAR */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 px-6 flex justify-between items-center z-30 pointer-events-none">
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">© 2026 Cargo Slot Planning</p>
        <div className="flex items-center gap-3 pointer-events-auto">
          {renderSaveStatusBadge()}
          {renderGoogleSyncBadge()}
          <p className="text-[10px] text-gray-400 font-medium opacity-55 hover:opacity-100 cursor-help transition-opacity">Build: v5.6.2</p>
        </div>
      </footer>
    </div>
  );
}
