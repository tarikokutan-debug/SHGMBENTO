import { StationEmails, AppFees } from "./types";
import { 
  UploadCloud, 
  CheckCircle, 
  Mail, 
  FileText 
} from "lucide-react";

export const STORAGE_KEY = "shgm_takip_flights_v2";
export const EMAILS_STORAGE_KEY = "shgm_takip_emails_v2";
export const FEES_STORAGE_KEY = "shgm_takip_fees_v2";
export const HANDLE_DB_NAME = "shgm_file_handle_db";
export const HANDLE_STORE = "file_handles";
export const INITIAL_FLIGHTS = [];
export const SPECIAL_DESTINATIONS = ["BGW", "EBL", "MJI", "KBL"];

export const INITIAL_FEES: AppFees = {
  "2026": {
    yeniPermi: 6275,
    permiDegisiklik: 3135,
    ilaveCharter: 5020,
    charterDegisiklik: 2510
  }
};

export const APP_TYPES = [
  { id: "yeniPermi", label: "Yeni Permi / Permiye Ilave" },
  { id: "permiDegisiklik", label: "Permide Degisiklik" },
  { id: "ilaveCharter", label: "Ilave Charter" },
  { id: "charterDegisiklik", label: "Charter Degisiklik" }
];

export const INITIAL_EMAILS: StationEmails = {
  ALA: ["ALACARGO@THY.COM", "KORAYDURSUN@THY.COM", "MSULIYEV@THY.COM", "MASLANOV@THY.COM"],
  ALG: ["ALGCARGO@THY.COM"], AMM: ["ammcargo@THY.COM"], AMS: ["AMSCARGO@THY.COM"],
  ARN: ["ARNCARGO@THY.COM"], ASB: ["ASBCARGO@THY.COM"], ATL: ["ATLCARGO@THY.COM", "ATLCARGOOPERATION@THY.COM"],
  BAH: ["BAHCARGO@THY.COM"], BCN: ["BCNCARGO@THY.COM"], BEG: ["BEGCARGO@THY.COM", "SONGULK@THY.COM"],
  BEY: ["BEYCARGO@THY.COM"], BGW: ["BGWCARGO@THY.COM"], BLL: ["BLLCARGO@THY.COM", "MEHMETGOKCE@THY.COM"],
  BOM: ["BOMCARGO@THY.COM", "ATRIPATHI@THY.COM"], BLR: ["BLRCARGO@THY.COM", "ATRIPATHI@THY.COM"],
  HYD: ["HYDCARGO@THY.COM", "ATRIPATHI@THY.COM"], MAA: ["MAACARGO@THY.COM", "ATRIPATHI@THY.COM"],
  DEL: ["delcargo@THY.COM", "ATRIPATHI@THY.COM"], BRU: ["BRUCARGO@THY.COM"], BSL: ["BSLCARGO@THY.COM"],
  BUD: ["BUDCARGO@THY.COM"], CAI: ["CAICARGO@THY.COM", "CAICARGOOFFICE@THY.COM"], CAN: ["CANCARGO@THY.COM"],
  CDG: ["CDGCARGO@THY.COM"], CGO: ["CGOCARGO@THY.COM", "BJSCARGOMG@THY.COM"], CIT: ["ALACARGO@THY.COM"],
  CMB: ["CMBCARGO@THY.COM"], CMN: ["CMNCARGO@THY.COM"], DAC: ["DACCARGO@THY.COM"], DMM: ["DMMCARGO@THY.COM"],
  DOH: ["DOHCARGO@THY.COM"], DSS: ["DKRCARGO@THY.COM"], DWC: ["DXBCARGO@THY.COM"], EBL: ["EBLCARGO@THY.COM"],
  FIH: ["FIHCARGO@THY.COM"], FRA: ["FRACARGO@THY.COM"], FRU: ["FRUCARGO@THY.COM"], GRU: ["GRUCARGO@THY.COM"],
  GYD: ["GYDCARGO@THY.COM"], HAN: ["HANCARGO@THY.COM"], HEL: ["HELCARGO@THY.COM"], HKG: ["HKGCARGO@THY.COM"],
  IAH: ["IAHCARGO@THY.COM", "IAHCARGOOPERATION@THY.COM"], ICN: ["SELCARGOMG@THY.COM", "icncargo@THY.COM"],
  JFK: ["JFKCARGOOPERATION@THY.COM", "JFKCARGOSALES@THY.COM"], JNB: ["JNBCARGO@THY.COM"],
  KHI: ["KHICARGO@THY.COM"], KTW: ["WAWCARGO@THY.COM"], KWI: ["KWICARGO@THY.COM"],
  LGG: ["LGGCARGO@THY.COM", "BRUCARGO@THY.COM"], LHE: ["LHECARGO@THY.COM", "KHICARGO@THY.COM"],
  LNZ: ["LNZCARGO@THY.COM"], LOS: ["LOSCARGO@THY.COM"], MAD: ["MADCARGO@THY.COM"], MCT: ["MCTCARGO@THY.COM"],
  MFM: ["HKGCARGO@THY.COM"], MIA: ["MIACARGO@THY.COM", "MIACARGOOPERATION@THY.COM"], MLA: ["MLACARGO@THY.COM"],
  MST: ["MSTCARGO@THY.COM"], MXP: ["MXPCARGO@THY.COM"], NBO: ["NBOCARGO@THY.COM"], NLU: ["MEXCARGO@THY.COM"],
  ORD: ["ORDCARGO@THY.COM"], OSL: ["OSLCARGO@THY.COM"], PRG: ["PRGCARGO@THY.COM"], PVG: [],
  RUH: ["RUHCARGO@THY.COM"], SGN: ["HANCARGO@THY.COM"], SHJ: ["DXBCARGOYG@THY.COM"], SNN: ["SNNCARGO@THY.COM"],
  STN: ["STNCARGO@THY.COM"], SZX: ["SZXCARGO@THY.COM"], TAS: ["TASCARGO@THY.COM", "NV1CARGO@THY.COM"],
  TBS: ["TBSCARGO@THY.COM"], TNR: ["TNRCARGO@THY.COM"], TPE: ["TPECARGO@THY.COM"], TUN: ["TUNCARGO@THY.COM"],
  UIO: ["UIOCARGO@THY.COM"], VNO: ["VNOCARGO@THY.COM"], YYZ: ["YYZCARGO@THY.COM"], ZRH: ["ZRHCARGO@THY.COM"],
  CPH: ["CPHCARGO@THY.COM"], DXB: ["DXBCARGO@THY.COM"], VIE: ["VIECARGO@THY.COM"], LHR: ["LHRCARGO@THY.COM"],
  PEK: ["BJSCARGO@THY.COM"], FCO: ["FCOCARGO@THY.COM"], DFW: ["DFWCARGO@THY.COM"],
  YYC: ["YYZCARGO@THY.COM", "YVRCARGO@THY.COM"], ABZ: ["EDICARGO@THY.COM"], IST: ["ISTCARGO@THY.COM"],
  KBL: ["KBLCARGO@THY.COM"], ATH: ["ATHCARGO@THY.COM"], LAX: ["LAXCARGO@THY.COM"], LJU: ["LJUCARGO@THY.COM"],
};

export const STANDARD_WORKFLOW = [
  { key: "APP_MADE", icon: UploadCloud, label: "Basvuru", line1: "BASVURU", line2: "YAPILDI" },
  { key: "APPROVED", icon: CheckCircle, label: "Onay", line1: "ONAY", line2: "GELDI" },
];

export const SPECIAL_WORKFLOW = [
  { key: "MAIL_SENT", icon: Mail, label: "Mail", line1: "MAIL", line2: "GONDER" },
  { key: "DOCS_RECEIVED", icon: FileText, label: "Evrak", line1: "EVRAK", line2: "GELDI" },
  { key: "APP_MADE", icon: UploadCloud, label: "Basvuru", line1: "BASVURU", line2: "YAPILDI" },
  { key: "APPROVED", icon: CheckCircle, label: "Onay", line1: "ONAY", line2: "GELDI" },
];
