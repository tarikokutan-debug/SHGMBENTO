export interface FlightTimestamp {
  PENDING?: number;
  MAIL_SENT?: number;
  DOCS_RECEIVED?: number;
  APP_MADE?: number;
  APPROVED?: number;
  REJECTED?: number;
  CANCELLED?: number;
  [statusKey: string]: number | undefined;
}

export interface Flight {
  id: string | number;
  al: string;
  flNo: string;
  date: string;
  day: string;
  orig: string;
  dest: string;
  std?: string;
  sta?: string;
  status: "PENDING" | "MAIL_SENT" | "DOCS_RECEIVED" | "APP_MADE" | "APPROVED" | "REJECTED";
  appType: "yeniPermi" | "permiDegisiklik" | "ilaveCharter" | "charterDegisiklik";
  aftnNo?: string;
  awbNo?: string;
  isDg?: boolean;
  cancelled?: boolean;
  bulkId?: string;
  isBulk?: boolean;
  timestamps: FlightTimestamp;
  notes?: string;
}

export interface AppFeesYil {
  yeniPermi: number;
  permiDegisiklik: number;
  ilaveCharter: number;
  charterDegisiklik: number;
}

export interface AppFees {
  [year: string]: AppFeesYil;
}

export interface StationEmails {
  [stationCode: string]: string[];
}

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      selectSharedFile: () => Promise<string | null>;
      readLocalJson: (filePath: string) => Promise<{ success: boolean; data?: any; lastModified?: number; error?: string }>;
      writeLocalJson: (filePath: string, data: any) => Promise<{ success: boolean; lastModified?: number; error?: string }>;
      onSelectedSharedFile: (callback: (filePath: string) => void) => void;
    };
  }
}
