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
  PlusCircle,
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
  Filter,
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
  parseDDMMYYYY,
  parseEndDateDDMMYYYY,
  formatShortAviationDate,
  formatGroupRoute,
  getSpecialStationCode,
  parseFlightDataFromJSON,
} from "./utils/helpers";
// Google Sheets features removed as requested by the airline team

// Sub-components
import DevirModal from "./components/DevirModal";
import MailPreviewModal from "./components/MailPreviewModal";
import EditGroupModal from "./components/EditGroupModal";
import ReportingView from "./components/ReportingView";
import SettingsView from "./components/SettingsView";


// Helper functions for persisting showSaveFilePicker's folder reference
const saveHandleToIDB = (handle: any): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    try {
      const request = indexedDB.open("shgm_file_handle_db", 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("file_handles")) {
          db.createObjectStore("file_handles");
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        try {
          const tx = db.transaction("file_handles", "readwrite");
          const store = tx.objectStore("file_handles");
          store.put(handle, "last_backup_handle");
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        } catch (e) {
          reject(e);
        }
      };
      request.onerror = () => reject(request.error);
    } catch (e) {
      reject(e);
    }
  });
};

const getHandleFromIDB = (): Promise<any | null> => {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open("shgm_file_handle_db", 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("file_handles")) {
          db.createObjectStore("file_handles");
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        try {
          const tx = db.transaction("file_handles", "readonly");
          const store = tx.objectStore("file_handles");
          const getReq = store.get("last_backup_handle");
          getReq.onsuccess = () => resolve(getReq.result || null);
          getReq.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
};

export default function App() {
  const [flights, setFlights] = useState<Flight[]>(INITIAL_FLIGHTS);
  const [lastFileHandle, setLastFileHandle] = useState<any>(null);
  const [stationEmails, setStationEmails] = useState<StationEmails>(INITIAL_EMAILS);
  const [appFees, setAppFees] = useState<AppFees>(INITIAL_FEES);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentView, setCurrentView] = useState("OPERATIONS");
  const [operationsTab, setOperationsTab] = useState("ACTIVE");
  const [showSummaryPanel, setShowSummaryPanel] = useState(false);
  const [feeYear, setFeeYear] = useState("2026");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Filter States
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [destFilter, setDestFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [settingsSearch, setSettingsSearch] = useState("");

  // Settings State Managers
  const [newStationCode, setNewStationCode] = useState("");
  const [newStationEmail, setNewStationEmail] = useState("");
  const [newEmailInput, setNewEmailInput] = useState<Record<string, string>>({});

  // Modals & Flows States
  const [showAddPanel, setShowAddPanel] = useState(false);
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
    notes: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // --- THEME SYSTEM ---
  const [theme, setTheme] = useState<"KURUMSAL" | "MINIMAL">(() => {
    try {
      const saved = localStorage.getItem("shgm_theme");
      return (saved === "KURUMSAL" || saved === "MINIMAL" || saved === "THY" || saved === "APPLE")
        ? (saved === "APPLE" || saved === "MINIMAL" ? "MINIMAL" : "KURUMSAL")
        : "KURUMSAL";
    } catch {
      return "KURUMSAL";
    }
  });

  const changeTheme = (newTheme: "KURUMSAL" | "MINIMAL") => {
    setTheme(newTheme);
    localStorage.setItem("shgm_theme", newTheme);
  };

  // --- BACKUP LOG SYSTEM ---
  const [backupLogs, setBackupLogs] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("shgm_backup_logs");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addBackupLog = useCallback((type: "MANUAL" | "AUTO" | "IMPORT" | "CLEAR", status: "SUCCESS" | "ERROR", message: string) => {
    const newLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      type,
      status,
      message
    };
    setBackupLogs((prev) => {
      const updated = [newLog, ...prev].slice(0, 100);
      localStorage.setItem("shgm_backup_logs", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearBackupLogs = useCallback(() => {
    setBackupLogs([]);
    localStorage.removeItem("shgm_backup_logs");
  }, []);

  // --- SHARED FILE & ELECTRON 15S AUTO SYNC ENGINE ---
  const DEFAULT_AVRASYA_PATH = "\\\\Avrasya\\THY_BSK_KARGO_GELIR_YONETIMI_VE_URETIM_PLANLAMA\\MD_KARGO_TARIFE\\04_Slot\\Slot_Otomasyonlari\\SHGM_Takip\\shgmdata.json";

  const [sharedFilePath, setSharedFilePath] = useState<string>(() => {
    try {
      return localStorage.getItem("shgm_shared_file_path") || DEFAULT_AVRASYA_PATH;
    } catch {
      return DEFAULT_AVRASYA_PATH;
    }
  });

  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("shgm_auto_sync_enabled");
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [lastServerModified, setLastServerModified] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isInitialReadDone, setIsInitialReadDone] = useState<boolean>(false);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  const showSyncToast = useCallback((msg: string) => {
    setSyncToastMessage(msg);
    setTimeout(() => {
      setSyncToastMessage(null);
    }, 4500);
  }, []);

  const isSyncingInFlightRef = useRef(false);

  const pushToSharedFileSync = useCallback(
    async (overrideFlights?: any[], overrideEmails?: any, overrideFees?: any, isManual = false) => {
      const targetF = overrideFlights || flights;
      const targetE = overrideEmails || stationEmails;
      const targetFees = overrideFees || appFees;

      if (!targetF || targetF.length === 0) return;
      if (isSyncingInFlightRef.current) return;

      try {
        isSyncingInFlightRef.current = true;
        if (isManual) setIsSyncing(true);

        if (typeof window !== "undefined" && window.electronAPI?.isElectron) {
          const payload = {
            version: "5.6.2",
            lastUpdated: Date.now(),
            flights: targetF,
            stationEmails: targetE,
            appFees: targetFees,
          };
          const res = await window.electronAPI.writeLocalJson(sharedFilePath, payload);
          if (res.success && res.lastModified) {
            setLastServerModified(res.lastModified);
            setLastSyncTime(new Date());
          }
        } else {
          const response = await fetch("/api/file-sync/write", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filePath: sharedFilePath,
              flights: targetF,
              stationEmails: targetE,
              appFees: targetFees,
              clientTimestamp: Date.now(),
            }),
          });
          if (response.ok) {
            const data = await response.json();
            if (data.lastModified) {
              setLastServerModified(data.lastModified);
              setLastSyncTime(new Date());
            }
          }
        }
      } catch (err) {
        console.warn("Shared file auto-push skipped:", err);
      } finally {
        isSyncingInFlightRef.current = false;
        if (isManual) setIsSyncing(false);
      }
    },
    [flights, stationEmails, appFees, sharedFilePath]
  );

  const checkAndSyncSharedFile = useCallback(
    async (isManualTrigger = false) => {
      if (isSyncingInFlightRef.current) return;
      try {
        isSyncingInFlightRef.current = true;
        if (isManualTrigger) setIsSyncing(true);

        let resLastModified = 0;
        let remoteData: any = null;

        if (typeof window !== "undefined" && window.electronAPI?.isElectron) {
          const res = await window.electronAPI.readLocalJson(sharedFilePath);
          if (res.success && res.data) {
            remoteData = res.data;
            resLastModified = res.lastModified || 0;
          }
        } else {
          const statusRes = await fetch(`/api/file-sync/status?filePath=${encodeURIComponent(sharedFilePath)}`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.exists) {
              resLastModified = statusData.lastModified;
              if (resLastModified > lastServerModified || isManualTrigger || !isInitialReadDone) {
                const readRes = await fetch(`/api/file-sync/read?filePath=${encodeURIComponent(sharedFilePath)}`);
                if (readRes.ok) {
                  const readData = await readRes.json();
                  if (readData.success && readData.data) {
                    remoteData = readData.data;
                  }
                }
              }
            } else if (isLoaded && flights.length > 0 && isInitialReadDone) {
              // File doesn't exist on server yet, write current local data
              isSyncingInFlightRef.current = false;
              await pushToSharedFileSync(undefined, undefined, undefined, false);
              return;
            }
          }
        }

        setIsInitialReadDone(true);
        const { flights: remoteFlights, stationEmails: remoteEmails, appFees: remoteFees } = parseFlightDataFromJSON(remoteData);

        if (remoteFlights && Array.isArray(remoteFlights) && remoteFlights.length > 0) {
          if (resLastModified > lastServerModified || isManualTrigger || !isInitialReadDone) {
            setFlights(remoteFlights);
            if (remoteEmails) setStationEmails(remoteEmails);
            if (remoteFees) setAppFees(remoteFees);

            setLastServerModified(resLastModified);
            setLastSyncTime(new Date());
            addBackupLog("AUTO", "SUCCESS", `Ortak dosyadan ${remoteFlights.length} uçuş senkronize edildi (1 Dk Otomatik Kontrol).`);
            if (!isManualTrigger) {
              showSyncToast("1 Dk Otomatik Kontrol: Ortak sunucu dosyasından yeni değişiklikler alındı.");
            } else {
              showSyncToast("Ortak dosya başarıyla senkronize edildi.");
            }
          }
        }
      } catch (err: any) {
        console.warn("Shared file sync check warning:", err?.message || err);
      } finally {
        isSyncingInFlightRef.current = false;
        if (isManualTrigger) setIsSyncing(false);
      }
    },
    [sharedFilePath, lastServerModified, flights, isLoaded, isInitialReadDone, pushToSharedFileSync, addBackupLog, showSyncToast]
  );

  useEffect(() => {
    try {
      localStorage.setItem("shgm_shared_file_path", sharedFilePath);
    } catch (e) {
      console.warn("Storage item save failed", e);
    }
  }, [sharedFilePath]);

  useEffect(() => {
    try {
      localStorage.setItem("shgm_auto_sync_enabled", JSON.stringify(autoSyncEnabled));
    } catch (e) {
      console.warn("Storage item save failed", e);
    }
  }, [autoSyncEnabled]);

  // 1-minute (60 seconds) polling timer
  useEffect(() => {
    if (!autoSyncEnabled || !isLoaded) return;

    const initialTimer = setTimeout(() => {
      checkAndSyncSharedFile(false);
    }, 1500);

    const syncInterval = setInterval(() => {
      checkAndSyncSharedFile(false);
    }, 60000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(syncInterval);
    };
  }, [autoSyncEnabled, isLoaded, checkAndSyncSharedFile]);

  // Listen for Electron shared file selection from menu
  useEffect(() => {
    if (typeof window !== "undefined" && window.electronAPI?.onSelectedSharedFile) {
      window.electronAPI.onSelectedSharedFile((selectedPath) => {
        if (selectedPath) {
          setSharedFilePath(selectedPath);
          showSyncToast(`Ortak dosya yolu güncellendi: ${selectedPath}`);
        }
      });
    }
  }, [showSyncToast]);

  const lastBackupTime = useMemo(() => {
    const successLogs = backupLogs.filter(log => log.status === "SUCCESS" && (log.type === "MANUAL" || log.type === "AUTO"));
    if (successLogs.length > 0) {
      return new Date(successLogs[0].timestamp).toLocaleString("tr-TR");
    }
    return null;
  }, [backupLogs]);

  useEffect(() => {
    try {
      document.documentElement.classList.remove("theme-thy", "theme-apple", "theme-kurumsal", "theme-minimal");
      document.body.classList.remove("theme-thy", "theme-apple", "theme-kurumsal", "theme-minimal");
      
      const themeClass = `theme-${theme.toLowerCase()}`;
      document.documentElement.classList.add(themeClass);
      document.body.classList.add(themeClass);
    } catch (e) {
      console.error("Failed to apply theme class:", e);
    }
  }, [theme]);

  const [settingsTab, setSettingsTab] = useState<"SYNC" | "SECURITY" | "EMAILS" | "FEES" | "THEMES" | "DATA">("SYNC");

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
    getHandleFromIDB().then((handle) => {
      if (handle) {
        setLastFileHandle(handle);
      }
    }).catch((err) => console.warn("IndexDB handle loading issue:", err));
    setIsLoaded(true);
  }, []);

  // Sync back local storage & push to shared server/local file
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(flights));
      localStorage.setItem(EMAILS_STORAGE_KEY, JSON.stringify(stationEmails));
      localStorage.setItem(FEES_STORAGE_KEY, JSON.stringify(appFees));

      // Auto write to shared file (3.5s debounce to ensure smooth typing without network I/O lag)
      const timer = setTimeout(() => {
        pushToSharedFileSync(undefined, undefined, undefined, false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [flights, stationEmails, appFees, isLoaded, pushToSharedFileSync]);



  // Devir reminders setup

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
  const manualDownload = useCallback(async () => {
    try {
      const filename = `shgm_takip_yedek_${new Date().toISOString().slice(0, 10)}.json`;
      const exportData = {
        version: "5.6.2",
        exportDate: new Date().toISOString(),
        flights,
        stationEmails,
        appFees,
      };
      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });

      if ("showSaveFilePicker" in window) {
        try {
          const pickerOptions: any = {
            suggestedName: filename,
            types: [
              {
                description: "JSON Yedek Dosyası",
                accept: {
                  "application/json": [".json"],
                },
              },
            ],
          };

          if (lastFileHandle) {
            pickerOptions.startIn = lastFileHandle;
          } else {
            pickerOptions.startIn = "downloads";
          }

          const handle = await (window as any).showSaveFilePicker(pickerOptions);
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          
          setLastFileHandle(handle);
          saveHandleToIDB(handle).catch((err) => console.warn("IndexDB save handle error:", err));

          addBackupLog("MANUAL", "SUCCESS", `Farklı kaydet ile başarıyla yedeklendi: ${handle.name} (${flights.length} uçuş)`);
          return;
        } catch (err: any) {
          if (err.name === "AbortError") {
            addBackupLog("MANUAL", "ERROR", "Kullanıcı farklı kaydetme işlemini iptal etti.");
            return;
          }
          console.warn("Farklı kaydet hatası, klasik indirmeye geçiliyor:", err);
        }
      }

      const u = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = u;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(u);
      addBackupLog("MANUAL", "SUCCESS", `Başarıyla yedek indirildi (Klasik): ${filename} (${flights.length} uçuş)`);
    } catch (err: any) {
      addBackupLog("MANUAL", "ERROR", `Yedek indirilirken hata oluştu: ${err.message || err}`);
    }
  }, [flights, stationEmails, appFees, lastFileHandle, addBackupLog]);

  const importFromJson = useCallback((file: File) => {
    const r = new FileReader();
    r.onload = (e) => {
      try {
        const raw = e.target?.result as string;
        const { flights: importedFlights, stationEmails: importedEmails, appFees: importedFees } = parseFlightDataFromJSON(raw);

        if (importedFlights && Array.isArray(importedFlights)) {
          if (window.confirm(`Mevcut yerel veriler silinip yüklenen dosyadan ${importedFlights.length} uçuş kaydı aktarılacak. Devam etmek istiyor musunuz?`)) {
            setFlights(importedFlights);
            if (importedEmails) setStationEmails(importedEmails);
            if (importedFees) setAppFees(importedFees);

            addBackupLog("IMPORT", "SUCCESS", `Dosyadan başarıyla veri yüklendi: ${file.name} (${importedFlights.length} uçuş)`);
            alert(`Veriler başarıyla aktarıldı! (${importedFlights.length} uçuş)`);
          }
        } else {
          alert("Geçersiz dosya formatı. Lütfen geçerli bir SHGM JSON veri veya yedek dosyası seçin.");
          addBackupLog("IMPORT", "ERROR", `Yükleme hatası: Geçersiz dosya formatı (${file.name})`);
        }
      } catch (err: any) {
        alert("Dosya okunamadı veya JSON biçimi geçersiz.");
        addBackupLog("IMPORT", "ERROR", `Yükleme hatası: ${err.message || err}`);
      }
    };
    r.readAsText(file, "utf-8");
  }, [addBackupLog, setFlights, setStationEmails, setAppFees]);

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

    if (targetStatusKey === "APPROVED") {
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
          notes: newFlight.notes || "",
        },
      ]);
      setNewFlight({ al: "TK", flNo: "", date: "", orig: "IST", dest: "", std: "", sta: "", awbNo: "", isDg: false, notes: "" });
    }
  };

  const toLocalDateTimeString = (timestamp: number | null | undefined) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      const tzOffset = date.getTimezoneOffset() * 60000; // in ms
      const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
      return localISOTime;
    } catch {
      return "";
    }
  };

  const fromLocalDateTimeString = (dateTimeStr: string) => {
    if (!dateTimeStr) return null;
    try {
      const d = new Date(dateTimeStr);
      return isNaN(d.getTime()) ? null : d.getTime();
    } catch {
      return null;
    }
  };

  const saveEditGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const appMadeTs = fromLocalDateTimeString(editGroupData.appMadeDate);
    const approvedTs = fromLocalDateTimeString(editGroupData.approvedDate);

    setFlights((prev) =>
      prev.map((f) => {
        const editedFlight = editGroupData.flights.find((ef: any) => ef.id === f.id);
        if (editedFlight) {
          const normalized = normalizeDate(editedFlight.date);
          const updatedTimestamps = { ...(f.timestamps || {}) };

          if (appMadeTs) {
            updatedTimestamps.APP_MADE = appMadeTs;
          } else {
            delete updatedTimestamps.APP_MADE;
          }

          if (approvedTs) {
            updatedTimestamps.APPROVED = approvedTs;
          } else {
            delete updatedTimestamps.APPROVED;
          }

          let newStatus = f.status;
          const enteredAftn = String(editGroupData.aftnNo || "").trim().toUpperCase();
          if (approvedTs && (f.status === "PENDING" || f.status === "APP_MADE" || f.status === "MAIL_SENT" || !f.status)) {
            newStatus = "APPROVED";
          } else if (!approvedTs && enteredAftn && (f.status === "PENDING" || f.status === "MAIL_SENT" || !f.status)) {
            newStatus = "APP_MADE";
          } else if (!approvedTs && f.status === "APPROVED") {
            newStatus = appMadeTs || enteredAftn ? "APP_MADE" : "PENDING";
          }

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
            notes: String(editedFlight.notes || ""),
            timestamps: updatedTimestamps,
            status: newStatus,
          };
        }
        return f;
      })
    );
    setIsEditModalOpen(false);
  };

  const openEditModal = (group: any) => {
    if (!group || !group.flights || group.flights.length === 0) return;
    const firstAppMade = group.flights.find((f: any) => f.timestamps?.APP_MADE)?.timestamps?.APP_MADE || null;
    const firstApproved = group.flights.find((f: any) => f.timestamps?.APPROVED)?.timestamps?.APPROVED || null;

    setEditGroupData({
      groupId: group.groupId,
      aftnNo: group.aftnNo !== "-" ? group.aftnNo : "",
      appType: group.flights[0]?.appType || "yeniPermi",
      appMadeDate: toLocalDateTimeString(firstAppMade),
      approvedDate: toLocalDateTimeString(firstApproved),
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
      try {
        localStorage.removeItem(STORAGE_KEY);
        setFlights(INITIAL_FLIGHTS);
        addBackupLog("CLEAR", "SUCCESS", "Tüm uçuş verileri başarıyla temizlendi.");
      } catch (err: any) {
        addBackupLog("CLEAR", "ERROR", `Temizleme işlemi sırasında hata oluştu: ${err.message || err}`);
      }
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
      const startDate = parseDDMMYYYY(f.date);
      const endDate = parseEndDateDDMMYYYY(f.date);
      return startDate <= maxDate && endDate >= today;
    });
    const groups: Record<string, Flight[]> = {};
    devirFlights.forEach((f) => {
      const key = f.aftnNo || "AFTN BEKLIYOR";
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    });
    return groups;
  }, [flights, currentDate]);

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

  const applicationSeqNumbers = useMemo(() => {
    const groups: Record<string, { key: string; appTimestamp: number; dateTs: number }> = {};
    flights.forEach((f) => {
      if (!f) return;
      const key = f.aftnNo ? String(f.aftnNo) : f.bulkId ? `BULK_${f.bulkId}` : `SINGLE_${f.id}`;

      let appTs = f.timestamps?.APP_MADE || f.timestamps?.MAIL_SENT || f.timestamps?.PENDING || f.createdAt;
      if (!appTs && typeof f.id === "number" && f.id > 1000000000000) {
        appTs = Math.floor(f.id);
      }

      let dTs = 0;
      if (f.date) {
        const parsed = parseDDMMYYYY(f.date);
        if (parsed && !isNaN(parsed.getTime())) {
          dTs = parsed.getTime();
        }
      }

      if (!groups[key]) {
        groups[key] = {
          key,
          appTimestamp: appTs || dTs || 0,
          dateTs: dTs,
        };
      } else {
        if (appTs && appTs > 0) {
          if (!groups[key].appTimestamp || appTs < groups[key].appTimestamp) {
            groups[key].appTimestamp = appTs;
          }
        }
        if (dTs && dTs > 0) {
          if (!groups[key].dateTs || dTs < groups[key].dateTs) {
            groups[key].dateTs = dTs;
          }
        }
      }
    });

    const sortedGroups = Object.values(groups).sort((a, b) => {
      if (a.appTimestamp !== b.appTimestamp && a.appTimestamp > 0 && b.appTimestamp > 0) {
        return a.appTimestamp - b.appTimestamp;
      }
      if (a.dateTs !== b.dateTs && a.dateTs > 0 && b.dateTs > 0) {
        return a.dateTs - b.dateTs;
      }
      if (a.appTimestamp !== b.appTimestamp) {
        return (a.appTimestamp || 0) - (b.appTimestamp || 0);
      }
      return a.key.localeCompare(b.key);
    });

    const seqMap: Record<string, number> = {};
    sortedGroups.forEach((g, index) => {
      seqMap[g.key] = index + 1;
    });
    return seqMap;
  }, [flights]);

  const archivedSeqNumbers = applicationSeqNumbers;

  // --- CORE SYSTEM DATA STREAMS ---
  const unifiedGroups = useMemo(() => {
    const groups: Record<string, any> = {};
    const filteredFlights = flights.filter((f) => {
      if (!f) return false;
      if (statusFilter === "PENDING") {
        if (f.status === "APPROVED" || f.status === "REJECTED" || f.cancelled) return false;
      } else if (statusFilter === "APPROVED") {
        if (f.status !== "APPROVED" || f.cancelled) return false;
      } else if (statusFilter === "REJECTED") {
        if (f.status !== "REJECTED" || f.cancelled) return false;
      } else if (statusFilter === "CANCELLED") {
        if (!f.cancelled) return false;
      }
      return true;
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
      const isPendingA = a.status !== "APPROVED" && a.status !== "REJECTED" && !(a.flights && a.flights[0] && a.flights[0].cancelled);
      const isPendingB = b.status !== "APPROVED" && b.status !== "REJECTED" && !(b.flights && b.flights[0] && b.flights[0].cancelled);

      if (isPendingA && !isPendingB) return -1;
      if (!isPendingA && isPendingB) return 1;

      if (isPendingA && isPendingB) {
        const daysArrA = a.flights.map((f: any) => calculateDaysLeft(String(f.date || ""), currentDate));
        const minDaysA = daysArrA.length > 0 ? Math.min(...daysArrA) : 999;
        const daysArrB = b.flights.map((f: any) => calculateDaysLeft(String(f.date || ""), currentDate));
        const minDaysB = daysArrB.length > 0 ? Math.min(...daysArrB) : 999;
        if (minDaysA !== minDaysB) return minDaysA - minDaysB;
      }

      const seqA = archivedSeqNumbers[a.groupId] || 0;
      const seqB = archivedSeqNumbers[b.groupId] || 0;
      if (seqA !== 0 || seqB !== 0) {
        return seqB - seqA;
      }
      return (b.timestamp || 0) - (a.timestamp || 0);
    });
  }, [flights, statusFilter, destFilter, searchTerm, dateFilter, currentDate, archivedSeqNumbers]);

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
      if (f && f.aftnNo) {
        let dateToUse: Date | null = null;
        if (f.timestamps?.APP_MADE) {
          const d = new Date(f.timestamps.APP_MADE);
          if (!isNaN(d.getTime())) dateToUse = d;
        }
        if (!dateToUse && f.timestamps?.APPROVED) {
          const d = new Date(f.timestamps.APPROVED);
          if (!isNaN(d.getTime())) dateToUse = d;
        }
        if (!dateToUse && f.timestamps?.REJECTED) {
          const d = new Date(f.timestamps.REJECTED);
          if (!isNaN(d.getTime())) dateToUse = d;
        }
        if (!dateToUse && f.timestamps?.CANCELLED) {
          const d = new Date(f.timestamps.CANCELLED);
          if (!isNaN(d.getTime())) dateToUse = d;
        }
        if (!dateToUse && f.date) {
          const parsed = parseDDMMYYYY(f.date);
          if (parsed && parsed.getFullYear() > 1900) {
            dateToUse = parsed;
          }
        }

        if (dateToUse && !isNaN(dateToUse.getTime())) {
          // Filter out far-future dates to prevent polluting the trend (e.g., 2028)
          const maxFutureDate = new Date(currentDate);
          maxFutureDate.setFullYear(currentDate.getFullYear() + 1);
          if (dateToUse > maxFutureDate) {
            return;
          }
          const mY = `${String(dateToUse.getMonth() + 1).padStart(2, "0")}.${dateToUse.getFullYear()}`;
          if (!months[mY]) months[mY] = { aftns: new Map() };
          const aftn = String(f.aftnNo).trim().toUpperCase();
          if (!months[mY].aftns.has(aftn)) {
            const year = dateToUse.getFullYear().toString();
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
  }, [flights, appFees, currentDate]);

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
      { label: "Bekleyen", value: pending, color: "bg-[#0B2341]" },
      { label: "Onayli", value: approved, color: "bg-emerald-500" },
      { label: "Reddedildi", value: rejected, color: "bg-[#C8102E]" },
      { label: "Iptal", value: cancelled, color: "bg-zinc-500" },
    ].filter((x) => x.value > 0);
  }, [flights]);

  const aftnTypeDistribution = useMemo(() => {
    const dist: Record<string, { count: number; cost: number; label: string }> = {
      yeniPermi: { count: 0, cost: 0, label: "Yeni Permi / İlave" },
      permiDegisiklik: { count: 0, cost: 0, label: "Permide Değişiklik" },
      ilaveCharter: { count: 0, cost: 0, label: "İlave Charter" },
      charterDegisiklik: { count: 0, cost: 0, label: "Charter Değişiklik" },
    };

    const aftnMap = new Map<string, { type: string; year: string }>();
    const allPricedFlights = flights.filter((f) => f && (f.status === "APPROVED" || f.status === "REJECTED") && !f.cancelled);

    allPricedFlights.forEach((f) => {
      const type = f.appType || "yeniPermi";
      const year = f.timestamps?.APP_MADE ? new Date(f.timestamps.APP_MADE).getFullYear().toString() : new Date().getFullYear().toString();
      if (f.aftnNo && String(f.aftnNo).trim() !== "") {
        const aftn = String(f.aftnNo).trim().toUpperCase();
        if (!aftnMap.has(aftn)) {
          aftnMap.set(aftn, { type, year });
        }
      } else {
        const feesForYear = appFees[year] || appFees[Object.keys(appFees).sort().pop() || "2026"] || INITIAL_FEES["2026"];
        const cost = (feesForYear[type as any] as any) || 0;
        if (dist[type]) {
          dist[type].count += 1;
          dist[type].cost += cost;
        }
      }
    });

    aftnMap.forEach((data) => {
      const feesForYear = appFees[data.year] || appFees[Object.keys(appFees).sort().pop() || "2026"] || INITIAL_FEES["2026"];
      const cost = (feesForYear[data.type as any] as any) || 0;
      if (dist[data.type]) {
        dist[data.type].count += 1;
        dist[data.type].cost += cost;
      }
    });

    return Object.entries(dist).map(([key, value]) => ({
      key,
      label: value.label,
      count: value.count,
      cost: value.cost,
    }));
  }, [flights, appFees]);

  const filteredStationsForSettings = useMemo(() => {
    return Object.keys(stationEmails)
      .filter((code) => String(code).includes(String(settingsSearch || "").toUpperCase()))
      .sort();
  }, [stationEmails, settingsSearch]);

  const renderWorkflowStepper = (group: any) => {
    if (group.status === "APPROVED") return null;

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
            let btnStyle = "bg-white border-2 border-zinc-900 text-zinc-400";
            if (isComp) btnStyle = "bg-[#C8102E] border-2 border-zinc-900 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]";
            else if (isNext) btnStyle = "bg-zinc-900 border-2 border-zinc-950 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] scale-110";
            return (
              <div key={step.key} className="relative flex justify-center group/btn">
                <span className="absolute -top-10 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-zinc-900 text-white text-[9px] font-mono uppercase font-bold tracking-wider px-2 py-1 rounded-md border border-zinc-800 whitespace-nowrap pointer-events-none z-20 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {String(step.line1)} {String(step.line2)}
                </span>
                <button
                  type="button"
                  onClick={() => handleStatusClick(group, step.key)}
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all focus:outline-none cursor-pointer hover:scale-110 active:scale-95 ${btnStyle}`}
                >
                  {isComp ? <Check size={14} strokeWidth={3} className="text-white" /> : <step.icon size={12} strokeWidth={2.5} />}
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
        <div className="max-w-[1800px] mx-auto px-4 md:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#C8102E] border-2 border-zinc-900 p-1.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] flex items-center justify-center">
              <Plane className="h-5 w-5 text-white transform -rotate-45" strokeWidth={3} />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-[15px] font-black leading-tight tracking-tight uppercase text-zinc-900">SHGM İZİN TAKİP SİSTEMİ</h1>
              <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider leading-none">v5.6.2 • PRODUCTION READY</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="bg-zinc-100 p-1 rounded-xl border-2 border-zinc-900 flex">
              {[
                { key: "OPERATIONS", label: "Operasyon Masası" },
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
                    currentView === key ? "bg-zinc-900 text-white" : "text-zinc-650 hover:text-zinc-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="md:hidden flex bg-zinc-100 p-1 rounded-lg border-2 border-zinc-900">
            <button
              onClick={() => {
                setCurrentView("OPERATIONS");
                setOperationsTab("ACTIVE");
                setStatusFilter("ALL");
              }}
              className={`p-2 rounded ${currentView === "OPERATIONS" ? "bg-zinc-900 text-white" : "text-zinc-650"}`}
              title="Operasyon"
            >
              <LayoutDashboard size={16} />
            </button>
            <button
              onClick={() => {
                setCurrentView("REPORTING");
              }}
              className={`p-2 rounded ${currentView === "REPORTING" ? "bg-zinc-900 text-white" : "text-zinc-650"}`}
              title="Raporlama"
            >
              <FileText size={16} />
            </button>
            <button
              onClick={() => setCurrentView("SETTINGS")}
              className={`p-2 rounded ${currentView === "SETTINGS" ? "bg-zinc-900 text-white" : "text-zinc-650"}`}
              title="Ayarlar"
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* FLOATING 15S SYNC NOTIFICATION TOAST */}
      {syncToastMessage && (
        <div className="fixed top-24 right-6 z-50 bg-zinc-900 text-white border-2 border-emerald-500 px-4 py-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 animate-fade-in">
          <span className="flex h-3 w-3 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <p className="text-xs font-bold font-mono text-emerald-300">{syncToastMessage}</p>
        </div>
      )}

      <main className="max-w-[1800px] mx-auto px-4 md:px-8 mt-6">
        {currentView === "OPERATIONS" && (
          <div className="animate-fade-in space-y-6">
            {/* GRID CONTAINER: Sol Panel (250px-300px veya 1/5 - 1/6 genişlik), Sağ Panel (Başvuru Kartları) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* SOL KOLON - lg:col-span-3 veya xl:col-span-2.5 */}
              <div className="lg:col-span-3 xl:col-span-3 2xl:col-span-2 space-y-4">
                {/* 1. DEVİR MAİLİ HAZIRLA BUTONU */}
                <button
                  onClick={() => setIsDevirModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-white border-2 border-zinc-900 rounded-2xl text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer font-bold"
                >
                  <BellRing size={18} /> DEVİR MAİLİ HAZIRLA
                </button>

                {/* 2. HIZLI BAŞVURU GİRİŞİ PANELİ */}
                <div className="bg-white p-4 rounded-2xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
                  <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-2.5 mb-3">
                    <div className="flex items-center gap-1.5">
                      <PlusCircle className="text-[#C8102E]" size={16} />
                      <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950">Hızlı Başvuru Girişi</h3>
                    </div>
                    <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-300">
                      <button
                        type="button"
                        className={`px-2 py-1 text-[9px] font-black uppercase rounded transition-all ${
                          addMode === "SINGLE" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                        }`}
                        onClick={() => setAddMode("SINGLE")}
                      >
                        Tekil
                      </button>
                      <button
                        type="button"
                        className={`px-2 py-1 text-[9px] font-black uppercase rounded transition-all ${
                          addMode === "BULK" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                        }`}
                        onClick={() => setAddMode("BULK")}
                      >
                        Toplu
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleDashboardSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1">Başvuru Türü</label>
                      <select
                        className="w-full px-2.5 py-1.5 bg-zinc-50 border-2 border-zinc-900 rounded-xl text-xs font-black uppercase focus:outline-none focus:bg-white cursor-pointer"
                        value={dashboardAppType}
                        onChange={(e) => setDashboardAppType(e.target.value)}
                      >
                        {APP_TYPES.map((t) => (
                          <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                      </select>
                    </div>

                    {addMode === "SINGLE" ? (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1 font-mono">Havayolu</label>
                            <input
                              type="text"
                              required
                              placeholder="TK"
                              className="w-full px-2.5 py-1.5 bg-zinc-50 border-2 border-zinc-900 rounded-xl text-xs font-bold uppercase focus:outline-none focus:bg-white font-mono"
                              value={newFlight.al}
                              onChange={(e) => setNewFlight({ ...newFlight, al: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1 font-mono">Sefer No</label>
                            <input
                              type="text"
                              required
                              placeholder="6302"
                              className="w-full px-2.5 py-1.5 bg-zinc-50 border-2 border-zinc-900 rounded-xl text-xs font-mono font-bold focus:outline-none focus:bg-white"
                              value={newFlight.flNo}
                              onChange={(e) => setNewFlight({ ...newFlight, flNo: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1">Kalkış</label>
                            <input
                              type="text"
                              required
                              placeholder="IST"
                              className="w-full px-2.5 py-1.5 bg-zinc-50 border-2 border-zinc-900 rounded-xl text-xs font-bold uppercase focus:outline-none focus:bg-white"
                              value={newFlight.orig}
                              onChange={(e) => setNewFlight({ ...newFlight, orig: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1">Varış</label>
                            <input
                              type="text"
                              required
                              placeholder="EBL"
                              className="w-full px-2.5 py-1.5 bg-zinc-50 border-2 border-zinc-900 rounded-xl text-xs font-bold uppercase focus:outline-none focus:bg-white"
                              value={newFlight.dest}
                              onChange={(e) => setNewFlight({ ...newFlight, dest: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1 font-mono">Tarih</label>
                            <input
                              type="text"
                              required
                              placeholder="04.05.2026"
                              className="w-full px-2.5 py-1.5 bg-zinc-50 border-2 border-zinc-900 rounded-xl text-xs font-mono font-bold focus:outline-none focus:bg-white"
                              value={newFlight.date}
                              onChange={(e) => setNewFlight({ ...newFlight, date: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1">STD (UTC)</label>
                            <input
                              type="time"
                              className="w-full px-2.5 py-1.5 bg-zinc-50 border-2 border-zinc-900 rounded-xl text-xs font-medium focus:outline-none focus:bg-white"
                              value={newFlight.std}
                              onChange={(e) => setNewFlight({ ...newFlight, std: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1">STA (UTC)</label>
                            <input
                              type="time"
                              className="w-full px-2.5 py-1.5 bg-zinc-50 border-2 border-zinc-900 rounded-xl text-xs font-medium focus:outline-none focus:bg-white"
                              value={newFlight.sta}
                              onChange={(e) => setNewFlight({ ...newFlight, sta: e.target.value })}
                            />
                          </div>
                        </div>

                        {SPECIAL_DESTINATIONS.includes(String(newFlight.dest).toUpperCase()) && (
                          <div className="p-2.5 bg-amber-50 border-2 border-zinc-900 rounded-xl">
                            <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider block mb-1">Özel İstasyon (AWB / DG)</span>
                            <div className="space-y-1.5">
                              <input
                                type="text"
                                placeholder="AWB No (235-...)"
                                className="w-full px-2 py-1 bg-white border-2 border-zinc-900 rounded-lg text-xs font-bold"
                                value={newFlight.awbNo || ""}
                                onChange={(e) => setNewFlight({ ...newFlight, awbNo: e.target.value })}
                              />
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="w-3.5 h-3.5 text-zinc-900 focus:ring-zinc-900 border-zinc-900 rounded"
                                  checked={newFlight.isDg || false}
                                  onChange={(e) => setNewFlight({ ...newFlight, isDg: e.target.checked })}
                                />
                                <span className="text-[9px] font-black text-amber-800">DG GÖNDERİ</span>
                              </label>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1">Takip Notu</label>
                          <input
                            type="text"
                            placeholder="Açıklama girin..."
                            className="w-full px-2.5 py-1.5 bg-zinc-50 border-2 border-zinc-900 rounded-xl text-xs font-medium focus:outline-none focus:bg-white placeholder-zinc-400"
                            value={newFlight.notes}
                            onChange={(e) => setNewFlight({ ...newFlight, notes: e.target.value })}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1">Uçuş Metnini Yapıştırın</label>
                        <textarea
                          placeholder="Örn: 1 TK6116 IST-MJI 11:10 23.07.2026..."
                          rows={6}
                          className="w-full px-2.5 py-1.5 bg-zinc-50 border-2 border-zinc-900 rounded-xl text-xs font-mono focus:outline-none focus:bg-white"
                          value={dashboardPasteContent}
                          onChange={handleDashboardPaste}
                        />
                        {dashboardParsedData.length > 0 && (
                          <div className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 p-2 rounded-lg font-mono">
                            ✓ {dashboardParsedData.length} uçuş ayrıştırıldı
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDashboardPasteContent("");
                          setDashboardParsedData([]);
                          setNewFlight({ al: "TK", flNo: "", date: "", orig: "IST", dest: "", std: "", sta: "", awbNo: "", isDg: false, notes: "" });
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-zinc-100 text-zinc-800 border-2 border-zinc-900 rounded-xl text-xs font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none cursor-pointer"
                      >
                        Temizle
                      </button>
                      <button
                        type="submit"
                        disabled={addMode === "BULK" && dashboardParsedData.length === 0}
                        className={`flex-1 px-3 py-1.5 bg-[#C8102E] hover:bg-red-700 text-white border-2 border-zinc-900 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer ${
                          addMode === "BULK" && dashboardParsedData.length === 0 ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        Takibe Al
                      </button>
                    </div>
                  </form>
                </div>

                {/* 3. FİLTRELEME SEÇENEKLERİ */}
                <div className="bg-white p-4 rounded-2xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] space-y-3">
                  <div className="flex items-center gap-1.5 border-b-2 border-zinc-900 pb-2">
                    <Filter className="text-zinc-900" size={16} />
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950">Filtreleme Seçenekleri</h3>
                  </div>

                  {/* Arama Alanı */}
                  <div>
                    <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1">Arama</label>
                    <div className="relative border-2 border-zinc-900 rounded-xl px-2.5 py-1.5 bg-white">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="AFTN, AWB veya Sefer..."
                        className="w-full pl-6 text-xs focus:outline-none placeholder-zinc-400 text-zinc-800 font-bold uppercase"
                      />
                    </div>
                  </div>

                  {/* Durum Filtresi */}
                  <div>
                    <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1">Durum Filtresi</label>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { id: "ALL", label: "Tümü" },
                        { id: "PENDING", label: "Bekleyen" },
                        { id: "APPROVED", label: "Onaylanan" },
                        { id: "REJECTED", label: "Reddedilen" },
                        { id: "CANCELLED", label: "İptal" },
                      ].map((st) => (
                        <button
                          key={st.id}
                          onClick={() => setStatusFilter(st.id)}
                          className={`px-2 py-1 text-[10px] font-black uppercase rounded-lg border-2 border-zinc-900 transition-all cursor-pointer ${
                            statusFilter === st.id
                              ? "bg-zinc-900 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                              : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* İstasyon Filtresi */}
                  <div>
                    <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1">İstasyon / Parkur</label>
                    <select
                      value={destFilter}
                      onChange={(e) => setDestFilter(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border-2 border-zinc-900 rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none text-zinc-700 cursor-pointer"
                    >
                      <option value="ALL">Tüm İstasyonlar</option>
                      {destinations.map((d) => (
                        <option key={d} value={d}>
                          {String(d)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tarih Filtresi */}
                  <div>
                    <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1">Tarih</label>
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                      className="w-full px-2.5 py-1.5 bg-white border-2 border-zinc-900 rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none text-zinc-700 cursor-pointer"
                    />
                  </div>

                  {(searchTerm || statusFilter !== "ALL" || destFilter !== "ALL" || dateFilter) && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("ALL");
                        setDestFilter("ALL");
                        setDateFilter("");
                      }}
                      className="w-full py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-2 border-zinc-900 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Filtreleri Temizle
                    </button>
                  )}
                </div>
              </div>

              {/* SAĞ KOLON - BAŞVURU KARTLARI (lg:col-span-9, xl:col-span-9, 2xl:col-span-10) */}
              <div className="lg:col-span-9 xl:col-span-9 2xl:col-span-10 space-y-4">
                {/* Kart Bölümü Üst Başlığı */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-white p-4 rounded-2xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
                  <div className="flex items-center gap-2">
                    <Plane className="transform -rotate-45 text-[#C8102E]" size={20} strokeWidth={2.5} />
                    <h2 className="text-sm font-black uppercase tracking-wider text-zinc-950">
                      BAŞVURU KARTLARI ({unifiedGroups.length})
                    </h2>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono font-bold text-zinc-500">
                    <span className="bg-zinc-100 border border-zinc-300 px-2.5 py-1 rounded-lg text-[10px] text-zinc-700 font-black">
                      Sıralama: Başvuru Sırasına Göre
                    </span>
                  </div>
                </div>

                {/* BAŞVURU KARTLARI GRID - Standart 5 Kart Gösterimi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-3.5 w-full">
                  {unifiedGroups.length > 0 ? (
                    unifiedGroups.map((group: any, idx: number) => {
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
                  let cardBorder = "border-amber-400";
                  let headerBg = "bg-amber-100/90";
                  let rowBgClass = "";

                  if (isCancelled) {
                    cardBorder = "border-red-500";
                    headerBg = "bg-red-100/90";
                    rowBgClass = "bg-red-50/20";
                  } else if (isRejected) {
                    cardBorder = "border-red-500";
                    headerBg = "bg-red-100/90";
                    rowBgClass = "bg-red-50/20";
                  } else if (!isPending) {
                    cardBorder = "border-emerald-500";
                    headerBg = "bg-emerald-100/90";
                    rowBgClass = "bg-emerald-50/20";
                  } else {
                    cardBorder = "border-amber-400";
                    headerBg = "bg-amber-100/90";
                    rowBgClass = "bg-amber-50/10";
                  }

                  let statusPill = null;
                  if (isCancelled)
                    statusPill = (
                      <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-black tracking-wide border border-zinc-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase">İPTAL</span>
                    );
                  else if (isRejected)
                    statusPill = (
                      <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-black tracking-wide border border-zinc-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase">REDDEDİLDİ</span>
                    );
                  else if (!isPending)
                    statusPill = (
                      <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-black tracking-wide border border-zinc-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase">ONAYLANDI</span>
                    );
                  else if (isPast)
                    statusPill = (
                      <span className="px-2 py-0.5 bg-zinc-800 text-white rounded text-[10px] font-black tracking-wide border border-zinc-900 uppercase">GEÇTİ</span>
                    );
                  else
                    statusPill = (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wide border border-zinc-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                          isUrgent ? "bg-red-600 text-white" : "bg-amber-300 text-zinc-950"
                        }`}
                      >
                        {minDays} GÜN KALDI
                      </span>
                    );

                  const specialStation = getSpecialStationCode(group.flights);
                  let title = "";
                  if (specialStation) {
                    title = `${specialStation} BAŞVURUSU`;
                  } else if (isSpecial && group.flights && group.flights[0]) {
                    title = String(group.flights[0].dest || "").toUpperCase() + " BAŞVURUSU";
                  } else if (group.flights && group.flights[0]) {
                    const dateRawStr = String(group.flights[0].date || "");
                    title = dateRawStr.includes("-") || dateRawStr.includes(" ") ? "DÖNEMSEL DEĞİŞİKLİK" : "MÜNFERİT DEĞİŞİKLİK";
                  }

                  const shortAviationDate = formatShortAviationDate(group.flights && group.flights[0]?.date || "");
                  const groupRoute = formatGroupRoute(group.flights || []);
                  const isDgApp = group.flights && group.flights.some((f: any) => f.isDg);

                  return (
                    <div
                      key={group.groupId}
                      className={`bg-white rounded-2xl border-2 ${cardBorder} shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] hover:shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all flex flex-col overflow-hidden h-full min-h-[310px] ${rowBgClass}`}
                    >
                      {/* HEADER */}
                      <div className={`p-3.5 border-b-2 ${cardBorder} flex justify-between items-center shrink-0 ${headerBg}`}>
                        <div
                          className="font-mono font-black text-sm text-zinc-950 tracking-tight truncate pr-2 flex items-center"
                          title={String(group.aftnNo || "TEKIL UCUS")}
                        >
                          <span className="text-xs font-black text-zinc-900 mr-2 bg-white px-2 py-0.5 rounded border border-zinc-900 font-mono shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            #{applicationSeqNumbers[group.groupId] || idx + 1}
                          </span>
                          {String(group.aftnNo || "TEKIL UCUS")}
                        </div>
                        {statusPill}
                      </div>
                      {/* BODY */}
                      <div className="p-4 flex-1 flex flex-col relative bg-white">
                        <div className="flex justify-between items-center mb-2 gap-2">
                          <div className="font-extrabold text-zinc-900 text-sm tracking-tight uppercase truncate">{title}</div>
                          {isDgApp && (
                            <span className="shrink-0 inline-flex items-center gap-1 bg-[#C8102E] text-white px-2 py-0.5 rounded-md text-[9px] font-black border border-zinc-900 font-mono shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase">
                              <Radiation size={11} /> DG BAŞVURU
                            </span>
                          )}
                        </div>

                        {/* SEFER BİLGİ SATIRI: TARİH + ROTA (Örn: 13AUG IST-BGW-IST) */}
                        {group.flights && group.flights.length > 0 && (
                          <div className="text-xs font-black font-mono text-zinc-900 bg-zinc-100 border-2 border-zinc-900 px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between mb-2.5">
                            <span className="text-[#C8102E] font-black tracking-wider">{shortAviationDate}</span>
                            <span className="tracking-wider font-extrabold">{groupRoute}</span>
                          </div>
                        )}

                        {group.flights && group.flights[0]?.awbNo && (
                          <div className="mb-2">
                            <span className="inline-flex items-center gap-1 bg-amber-200 text-zinc-900 px-2.5 py-0.5 rounded-lg text-[10px] font-black border border-zinc-900 font-mono">
                              AWB: {group.flights[0].awbNo}
                            </span>
                          </div>
                        )}

                        <div className="mb-auto">
                          {isBulkGroup ? (
                            <div className="text-xs text-zinc-650 leading-relaxed font-medium">
                              <span className="font-bold text-zinc-800 block mb-1 uppercase text-[10px] tracking-wider">{group.flights?.length || 0} Uçuş İçeriyor:</span>
                              {group.flights.slice(0, 4).map((f: any) => `${String(f.al || "TK")}${f.flNo}`).join(", ")}
                              {group.flights.length > 4 ? (
                                <span className="text-zinc-400"> ve {group.flights.length - 4} daha...</span>
                              ) : (
                                ""
                              )}
                            </div>
                          ) : (
                            <div className="flex justify-between items-center text-xs font-bold text-zinc-500 mt-1">
                              <span>Saat (UTC):</span>
                              <span className="bg-zinc-100 border border-zinc-300 px-1.5 py-0.5 rounded font-mono">
                                {String(group.flights[0]?.std || "")} - {String(group.flights[0]?.sta || "")}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* NOTES FIELD DISPLAY (Recommendation 4) */}
                        {group.flights && group.flights.some((f: any) => f.notes) && (
                          <div className="mt-3 p-2.5 bg-blue-50/50 border border-blue-200/60 rounded-xl text-[11px] text-zinc-650 font-medium">
                            <span className="font-bold text-zinc-700 block mb-0.5 text-[9px] uppercase tracking-wider">Takip Notu:</span>
                            {group.flights.find((f: any) => f.notes)?.notes}
                          </div>
                        )}

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
                  <p className="text-sm font-medium">Bu kriterlerde bir operasyon kaydı bulunamadı.</p>
                </div>
              )}
            </div>
          </div>
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
            aftnTypeDistribution={aftnTypeDistribution}
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
            theme={theme}
            setTheme={changeTheme}
            backupLogs={backupLogs}
            lastBackupTime={lastBackupTime}
            clearBackupLogs={clearBackupLogs}
            sharedFilePath={sharedFilePath}
            setSharedFilePath={setSharedFilePath}
            autoSyncEnabled={autoSyncEnabled}
            setAutoSyncEnabled={setAutoSyncEnabled}
            lastSyncTime={lastSyncTime}
            isSyncing={isSyncing}
            checkAndSyncSharedFile={checkAndSyncSharedFile}
            pushToSharedFileSync={pushToSharedFileSync}
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
            <div className="flex-1 overflow-auto p-6 bg-gray-50/50 flex flex-col">
              {(() => {
                const firstAppMade = selectedArchiveGroup.flights.find((f: any) => f.timestamps?.APP_MADE)?.timestamps?.APP_MADE;
                const firstApproved = selectedArchiveGroup.flights.find((f: any) => f.timestamps?.APPROVED)?.timestamps?.APPROVED;
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">BAŞVURU TARİHİ & SAATİ</span>
                      <span className="text-sm font-bold text-gray-800 font-mono">
                        {firstAppMade ? new Date(firstAppMade).toLocaleString("tr-TR") : "Girilmemiş / Mevcut Değil"}
                      </span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">ONAY GELİŞ TARİHİ & SAATİ</span>
                      <span className="text-sm font-bold text-gray-800 font-mono">
                        {firstApproved ? new Date(firstApproved).toLocaleString("tr-TR") : "Girilmemiş / Henüz Onaylanmadı"}
                      </span>
                    </div>
                  </div>
                );
              })()}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Sefer</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tarih</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Parkur</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Kapsam</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Notlar</th>
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
                        <td className="px-6 py-3 text-xs text-gray-600 font-medium max-w-[150px] truncate" title={f.notes || ""}>
                          {f.notes || <span className="text-zinc-300">-</span>}
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
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">2026 CARGO SLOT - TOKUTAN@THY.COM</p>
        <div className="flex items-center gap-3 pointer-events-auto">
          {renderSaveStatusBadge()}
          <p className="text-[10px] text-gray-400 font-medium opacity-55 hover:opacity-100 cursor-help transition-opacity">Build: v5.6.2</p>
        </div>
      </footer>
    </div>
  );
}
