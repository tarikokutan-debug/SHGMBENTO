import React, { useState } from "react";
import { 
  Database, 
  Mail, 
  Plus, 
  Search, 
  Trash2, 
  X, 
  CreditCard,
  Download,
  UploadCloud,
  RefreshCw,
  Table as TableIcon,
  Copy,
  Check
} from "lucide-react";
import { sanitizeGoogleSheetsUrl, sanitizeGoogleAppsScriptUrl } from "../utils/googleSheets";

interface SettingsViewProps {
  settingsTab: "EMAILS" | "FEES" | "DATA";
  setSettingsTab: (tab: "EMAILS" | "FEES" | "DATA") => void;
  stationEmails: any;
  setStationEmails: React.Dispatch<React.SetStateAction<any>>;
  appFees: any;
  setAppFees: React.Dispatch<React.SetStateAction<any>>;
  feeYear: string;
  setFeeYear: (year: string) => void;
  settingsSearch: string;
  setSettingsSearch: (term: string) => void;
  newStationCode: string;
  setNewStationCode: (code: string) => void;
  newStationEmail: string;
  setNewStationEmail: (email: string) => void;
  newEmailInput: Record<string, string>;
  setNewEmailInput: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  filteredStationsForSettings: string[];
  handleAddStation: (e: React.FormEvent) => void;
  handleAddEmailToStation: (stationCode: string, email: string) => void;
  handleRemoveEmailFromStation: (stationCode: string, emailToRemove: string) => void;
  handleDeleteStation: (stationCode: string) => void;
  handleAddFeeYear: () => void;
  handleFeeChange: (type: string, value: string) => void;
  manualDownload: () => void;
  importInputRef: React.RefObject<HTMLInputElement | null>;
  importFromJson: (file: File) => void;
  clearAllData: () => void;
  
  // Google Sheets Props
  googleSheetsUrl: string;
  setGoogleSheetsUrl: (url: string) => void;
  googleAppsScriptUrl: string;
  setGoogleAppsScriptUrl: (url: string) => void;
  googleSyncStatus: string;
  lastSyncTime: Date | null;
  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (val: boolean) => void;
  handleGooglePull: () => Promise<void>;
  handleGooglePush: () => Promise<void>;
  handleGoogleFullSync: () => Promise<void>;
}

export default function SettingsView({
  settingsTab,
  setSettingsTab,
  stationEmails,
  setStationEmails,
  appFees,
  setAppFees,
  feeYear,
  setFeeYear,
  settingsSearch,
  setSettingsSearch,
  newStationCode,
  setNewStationCode,
  newStationEmail,
  setNewStationEmail,
  newEmailInput,
  setNewEmailInput,
  filteredStationsForSettings,
  handleAddStation,
  handleAddEmailToStation,
  handleRemoveEmailFromStation,
  handleDeleteStation,
  handleAddFeeYear,
  handleFeeChange,
  manualDownload,
  importInputRef,
  importFromJson,
  clearAllData,
  
  googleSheetsUrl,
  setGoogleSheetsUrl,
  googleAppsScriptUrl,
  setGoogleAppsScriptUrl,
  googleSyncStatus,
  lastSyncTime,
  autoSyncEnabled,
  setAutoSyncEnabled,
  handleGooglePull,
  handleGooglePush,
  handleGoogleFullSync,
}: SettingsViewProps) {
  const [copiedScript, setCopiedScript] = useState(false);

  const googleScriptCode = `/*
  ==============================================================
  GOOGLE SHEET TO CO-PILOT SYNC SCRIPT (SHGM PORTAL)
  ==============================================================
  Bu kod, SHGM uçuş takip uygulamanızın Google E-Tablonuza hem veri yazmasını
  hem de verileri anında oradan okumasını ve sütun başlıklarını otomatik oluşturmasını sağlar.

  NASIL KULLANILIR:
  1. Google E-Tablonuzu açın. 
  2. Üst menüden "Uzantılar" > "Apps Script" kısmına tıklayın.
  3. Açılan kod editöründeki tüm kodları silin ve yerine BU KODU yapıştırın.
  4. "Kaydet" (Disket simgesi) butonuna basın.
  5. Sağ üstteki "Dağıt" > "Yeni Dağıtım" butonuna tıklayın.
  6. Türünü "Web Uygulaması" olarak seçin.
  7. Ayarları şu şekilde yapın:
     - Uygulamayı şu kişi olarak yürüt: "Ben" (Hesabınız)
     - Kimlerin erişimi var: "Herkes" (Bunu seçmeniz güvenli CORS bağlantısı ve API erişimi için gereklidir)
  8. "Dağıt" deyin ve erişim yetkilerini onaylayın (Advanced > Go to Untitled Project / Güvenli Değil diyerek izin verin).
  9. Size verilen "Web Uygulaması URL'si" kopyalayıp aşağıdaki "Google Apps Script API URL" kutusuna yapıştırın.
*/

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  ensureHeaders(sheet);
  var data = getSheetData(sheet);
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  ensureHeaders(sheet);
  
  var body = e.postData.contents;
  var flights = JSON.parse(body);
  
  // Tablo başlıkları hariç verileri temizleyip yeniden yazarız
  sheet.clearContents();
  ensureHeaders(sheet);
  
  var headers = getHeaders();
  var rows = flights.map(function(item) {
    return headers.map(function(h) {
      if (h === "timestamps") {
        return typeof item[h] === "string" ? item[h] : JSON.stringify(item[h] || {});
      }
      return item[h] !== undefined ? item[h] : "";
    });
  });
  
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: "success", count: rows.length }))
    .setMimeType(ContentService.MimeType.JSON);
}

function ensureHeaders(sheet) {
  var headers = getHeaders();
  var range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers]);
  range.setFontWeight("bold");
  sheet.setFrozenRows(1);
}

function getHeaders() {
  return [
    "id", "al", "flNo", "date", "day", "orig", "dest", "std", "sta", 
    "status", "appType", "aftnNo", "awbNo", "isDg", "cancelled", "isBulk", "bulkId", "timestamps"
  ];
}

function getSheetData(sheet) {
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var headers = rows[0];
  var data = [];
  for (var i = 1; i < rows.length; i++) {
    var rawRow = rows[i];
    var obj = {};
    headers.forEach(function(h, idx) {
      if (h) {
        obj[h] = rawRow[idx];
      }
    });
    data.push(obj);
  }
  return data;
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(googleScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex bg-zinc-100 p-1 rounded-xl border-2 border-zinc-900 inline-flex mb-4 overflow-x-auto max-w-full">
        <button
          onClick={() => setSettingsTab("EMAILS")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${settingsTab === "EMAILS" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"}`}
        >
          <Mail size={14} /> Mail Adresleri
        </button>
        <button
          onClick={() => setSettingsTab("FEES")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${settingsTab === "FEES" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"}`}
        >
          <CreditCard size={14} /> Basvuru Ucretleri
        </button>
        <button
          onClick={() => setSettingsTab("DATA")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${settingsTab === "DATA" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"}`}
        >
          <Database size={14} /> Veri ve Yedekleme
        </button>
      </div>

      {settingsTab === "EMAILS" && (
        <div className="bg-white p-8 rounded-3xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 border-2 border-zinc-900 p-5 rounded-2xl flex flex-col items-center justify-center shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
              <span className="text-zinc-500 text-[10px] font-black uppercase font-mono tracking-wider mb-1">Toplam Istasyon</span>
              <span className="text-4xl font-extrabold italic text-zinc-900 font-mono">{Object.keys(stationEmails).length}</span>
            </div>
            <div className="bg-emerald-50 border-2 border-zinc-900 p-5 rounded-2xl flex flex-col items-center justify-center shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
              <span className="text-zinc-500 text-[10px] font-black uppercase font-mono tracking-wider mb-1">Kayitli Mail Adresi</span>
              <span className="text-4xl font-extrabold italic text-zinc-900 font-mono">{Object.values(stationEmails).reduce((acc: number, arr: any) => acc + arr.length, 0)}</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8 border-b-2 border-zinc-900 pb-6">
            <form onSubmit={handleAddStation} className="w-full md:w-1/2">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 mb-3">Yeni Istasyon Ekle</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Kod (YVZ)"
                  className="w-24 px-3 py-2 bg-white border-2 border-zinc-900 rounded-xl text-sm font-black uppercase tracking-wider focus:outline-none placeholder-zinc-400"
                  value={newStationCode}
                  onChange={(e) => setNewStationCode(String(e.target.value).toUpperCase().slice(0, 3))}
                  maxLength={3}
                  required
                />
                <input
                  type="email"
                  placeholder="Mail Adresi"
                  className="flex-1 px-3 py-2 bg-white border-2 border-zinc-900 rounded-xl text-sm font-bold uppercase focus:outline-none placeholder-zinc-400"
                  value={newStationEmail}
                  onChange={(e) => setNewStationEmail(e.target.value)}
                  required
                />
                <button type="submit" className="bg-[#C8102E] border-2 border-zinc-900 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wide shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] transition-all cursor-pointer">
                  Ekle
                </button>
              </div>
            </form>
            <div className="w-full md:w-1/3">
              <div className="relative border-2 border-zinc-900 rounded-xl bg-white px-3 py-1.5 flex items-center">
                <Search className="h-4 w-4 text-zinc-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Istasyon Ara..."
                  className="w-full text-xs font-bold uppercase bg-transparent focus:outline-none placeholder-zinc-400"
                  value={settingsSearch}
                  onChange={(e) => setSettingsSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredStationsForSettings.map((code) => (
              <div key={code} className="bg-white border-2 border-zinc-900 rounded-2xl p-4 flex flex-col h-full shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] hover:shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-black text-zinc-900 font-mono bg-zinc-100 border-2 border-zinc-900 px-2 py-0.5 rounded-lg text-sm">{String(code)}</span>
                  <button onClick={() => handleDeleteStation(code)} className="text-zinc-400 hover:text-red-600 p-1 rounded-md transition-colors border border-transparent hover:border-zinc-300">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex-1 space-y-2 mb-4 max-h-40 overflow-y-auto pr-1">
                  {stationEmails[code] && stationEmails[code].length > 0 ? (
                    stationEmails[code].map((m: string, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] bg-zinc-50 border border-zinc-200 px-2.5 py-1.5 rounded-lg font-bold">
                        <span className="truncate mr-2 font-mono text-zinc-700">{String(m)}</span>
                        <button onClick={() => handleRemoveEmailFromStation(code, m)} className="text-zinc-400 hover:text-red-600 transition-colors">
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-zinc-400 italic">Kayitli mail yok.</div>
                  )}
                </div>
                <div className="flex gap-1 mt-auto shrink-0 relative">
                  <input
                    type="email"
                    placeholder="Yeni mail ekle..."
                    className="flex-1 p-2 pr-8 text-xs bg-white border-2 border-zinc-900 rounded-lg uppercase font-bold focus:outline-none"
                    value={newEmailInput[code] || ""}
                    onChange={(e) => setNewEmailInput({ ...newEmailInput, [code]: e.target.value })}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleAddEmailToStation(code, newEmailInput[code]);
                    }}
                  />
                  <button
                    onClick={() => handleAddEmailToStation(code, newEmailInput[code])}
                    className="absolute right-1 top-1 bottom-1 px-2 text-zinc-400 hover:text-zinc-900"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {settingsTab === "FEES" && (
        <div className="bg-white p-8 rounded-3xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] max-w-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 flex items-center gap-2">
              <CreditCard size={18} className="text-zinc-900" /> Basvuru Ucretleri (TL)
            </h3>
            <div className="flex gap-2">
              <select
                value={feeYear}
                onChange={(e) => setFeeYear(e.target.value)}
                className="px-4 py-2 bg-white border-2 border-zinc-900 rounded-xl text-xs font-black focus:outline-none pr-8 cursor-pointer"
              >
                {Object.keys(appFees)
                  .sort()
                  .reverse()
                  .map((y) => (
                    <option key={y} value={y}>{y} Yili</option>
                  ))}
              </select>
              <button onClick={handleAddFeeYear} className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold uppercase hover:bg-zinc-800 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer">
                Yeni Yil Ekle
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { key: "yeniPermi", label: "Yeni Permi / Permiye Ilave" },
              { key: "permiDegisiklik", label: "Permide Degisiklik" },
              { key: "ilaveCharter", label: "Ilave Charter" },
              { key: "charterDegisiklik", label: "Charter Degisiklik" },
            ].map((fee) => (
              <div key={fee.key} className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-800">{fee.label}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={appFees[feeYear]?.[fee.key] || 0}
                    onChange={(e) => handleFeeChange(fee.key, e.target.value)}
                    className="w-32 px-4 py-1.5 bg-white border-2 border-zinc-900 rounded-lg text-right font-mono font-black text-zinc-900 focus:outline-none pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-900 font-bold text-xs pointer-events-none">₺</span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[10px] font-mono text-zinc-400">* Raporlama sayfasindaki maliyet hesaplamasi secili yila ve basvuru turune gore otomatik olarak hesaplanmaktadir.</p>
        </div>
      )}

      {settingsTab === "DATA" && (
        <div className="space-y-8 animate-fade-in">
          {/* Google Sheets Configuration & Integration Panel */}
          <div className="bg-white p-8 rounded-3xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] max-w-4xl">
            <div className="flex items-center gap-3 border-b-2 border-zinc-900 pb-4 mb-6">
              <div className="bg-emerald-100 text-emerald-800 border-2 border-zinc-900 p-2 rounded-xl shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <TableIcon size={20} />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-zinc-900">Google Sheets Bulut Senkronizasyonu</h3>
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wide">Google E-Tablo entegrasyonu ile verileri guvenle depolayin, yukleyin ve esitleyin.</p>
              </div>
            </div>

            {/* Custom Google Sheets Input Fields */}
            <div className="space-y-4 mb-8">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-800 font-mono">
                  Google Sheet Web Yayını URL (GET - Salt Okunur / CSV)
                </label>
                <input
                  type="text"
                  value={googleSheetsUrl}
                  onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                  onBlur={(e) => setGoogleSheetsUrl(sanitizeGoogleSheetsUrl(e.target.value))}
                  placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
                  className="w-full px-4 py-2.5 bg-white border-2 border-zinc-900 rounded-xl text-xs font-mono font-bold focus:outline-none text-zinc-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
                <span className="text-[10px] text-zinc-400 font-medium">
                  E-Tablonuzu internette "Web'e yayınla" dedikten sonra ortaya çıkan CSV bağlantısıdır. Başlangıçta verileri çekmek için bağımsız olarak kullanılabilir.
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-800 font-mono">
                  Google Apps Script Web App URL (GET & POST - Tam Yetki / Başlık Düzenleyici)
                </label>
                <input
                  type="text"
                  value={googleAppsScriptUrl}
                  onChange={(e) => setGoogleAppsScriptUrl(e.target.value)}
                  onBlur={(e) => setGoogleAppsScriptUrl(sanitizeGoogleAppsScriptUrl(e.target.value))}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-4 py-2.5 bg-white border-2 border-zinc-900 rounded-xl text-xs font-mono font-bold focus:outline-none text-zinc-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
                <span className="text-[10px] text-zinc-400 font-medium">
                  Kaydetme (Buluta Yazma) ve otomatik başlık kurgulama işlemleri için bu bağlantıyı tanımlayın. Aşağıdaki kurulum panelinden kodu kopyalayabilirsiniz.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pt-2">
              <div className="bg-zinc-100 p-4 rounded-xl border-2 border-zinc-900 space-y-2.5 text-xs font-mono">
                <div><span className="font-bold text-zinc-500">Aktif Kaynak:</span> <code className="font-mono text-zinc-800 block truncate" title={googleAppsScriptUrl || googleSheetsUrl}>{googleAppsScriptUrl || googleSheetsUrl}</code></div>
                <div><span className="font-bold text-zinc-500">Son Esitleme:</span> <span className="font-black text-zinc-800">{lastSyncTime ? lastSyncTime.toLocaleString("tr-TR") : "Senkronize Edilmedi"}</span></div>
                <div className="flex items-center">
                  <span className="font-bold text-zinc-500">Durum:</span> 
                  <span className={`ml-2 px-2.5 py-0.5 rounded border border-zinc-900 text-[10px] font-black uppercase tracking-wider ${
                    googleSyncStatus === "idle" && lastSyncTime ? "bg-emerald-300 text-zinc-950" :
                    googleSyncStatus === "success" ? "bg-emerald-300 text-zinc-950" :
                    googleSyncStatus === "error" ? "bg-red-300 text-zinc-950" : "bg-blue-300 text-zinc-950"
                  }`}>
                    {googleSyncStatus === "idle" && lastSyncTime ? "AKTİF" :
                     googleSyncStatus === "loading" ? "YÜKLENİYOR" :
                     googleSyncStatus === "saving" ? "KAYDEDİLİYOR" :
                     googleSyncStatus === "error" ? "BAĞLANTI HATASI" : "BAĞLANDI"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col justify-center p-4 bg-zinc-50 border-2 border-zinc-900 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-2 border-zinc-900 text-zinc-905 focus:ring-0 checked:bg-zinc-900 cursor-pointer"
                    checked={autoSyncEnabled}
                    onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                  />
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-900 block">Her Islemi Otomatik Yaz (Auto-Sync)</span>
                    <span className="text-[10px] text-zinc-400 block mt-0.5 font-mono">Permi ekleme, onay degisikligi ve iptallerde Google Sheets'i debounced olarak besler.</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-start gap-4 border-t-2 border-zinc-900 pt-5">
              <button
                onClick={handleGoogleFullSync}
                disabled={googleSyncStatus === "loading" || googleSyncStatus === "saving"}
                className="flex items-center gap-2 px-5 py-3 bg-emerald-300 text-zinc-900 text-xs font-black uppercase tracking-wider border-2 border-zinc-900 rounded-xl hover:bg-emerald-400 transition shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                <RefreshCw size={14} className={googleSyncStatus === "loading" ? "animate-spin" : ""} /> Çift Yönlü Tam Eşitle (Merge / Çek & Yaz)
              </button>
              <button
                onClick={handleGooglePull}
                disabled={googleSyncStatus === "loading" || googleSyncStatus === "saving"}
                className="flex items-center gap-2 px-5 py-3 bg-white text-zinc-900 border-2 border-zinc-900 text-xs font-bold uppercase rounded-xl hover:bg-zinc-50 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 cursor-pointer"
              >
                <Download size={14} /> Buluttan Veri Çek (Sadece Oku)
              </button>
              <button
                onClick={handleGooglePush}
                disabled={googleSyncStatus === "loading" || googleSyncStatus === "saving"}
                className="flex items-center gap-2 px-5 py-3 bg-white text-zinc-900 border-2 border-zinc-900 text-xs font-bold uppercase rounded-xl hover:bg-zinc-50 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 cursor-pointer"
              >
                <UploadCloud size={14} /> Yerel Veriyi Buluta Yaz (Kaydet)
              </button>
            </div>
          </div>

          {/* Apps Script Setup Instructions Panel */}
          <div className="bg-amber-50 p-8 rounded-3xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] max-w-4xl">
            <div className="flex justify-between items-start gap-4 flex-wrap border-b border-zinc-900 pb-4 mb-4">
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-zinc-900">Kurulum Klavuzu & Google Apps Script Kod Deposu</h4>
                <p className="text-[10px] text-zinc-600 font-mono uppercase mt-0.5">E-Tablonuzun otomatik başlık kurma ve veri kaydetme mekanizmasını aktif edin.</p>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-950 text-white text-xs font-bold rounded-lg hover:bg-zinc-800 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                {copiedScript ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copiedScript ? "Kopyalandı!" : "Kodu Kopyala"}
              </button>
            </div>

            <ol className="list-decimal list-inside text-xs leading-relaxed text-zinc-800 font-mono space-y-2.5 mb-6">
              <li>Mevcut Google E-Tablo dosyanızı açın (bağlantı url sahibi olmalıdır).</li>
              <li>Üst panodaki <span className="bg-zinc-150 px-1 border border-zinc-300 rounded">Uzantılar</span> menüsünden <span className="bg-zinc-150 px-1 border border-zinc-300 rounded">Apps Script</span> sekmesini açın.</li>
              <li>Oradaki varsayılan kod satırlarını tamamen temizleyip kopyaladığınız kodu buraya yapıştırın ve disket butonuyla kaydedin.</li>
              <li>Sağ üst köşedeki <span className="text-[#C8102E] font-bold">Dağıt</span> butonuna basıp <span className="font-bold">"Yeni Dağıtım"</span> deyin.</li>
              <li>Sol üstte çark simgesinden tür seçip <span className="font-bold">"Web Uygulaması"</span> seçeneğini tıklayın.</li>
              <li>Ayarları: "Yürütücü: <span className="font-bold">Ben</span>", "Erişim Yetkisi: <span className="font-bold">Herkes</span>" yapıp Dağıt butonuna tıklayarak açılan onay penceresinde izni verin.</li>
              <li>Oluşan bağlantıyı (<span className="italic font-mono">https://script.google.com/macros/s/...</span>) kopyalayıp yukarıdaki Google Apps Script kutusuna yazın. Başlıklar ve veri akışı artık milisaniyeler içerisinde çift yönlü senkronize olur!</li>
            </ol>

            <div className="relative">
              <pre className="p-4 bg-zinc-900 text-[#a6e22e] rounded-xl border-2 border-zinc-950 font-mono text-[9.5px] max-h-52 overflow-y-auto whitespace-pre leading-normal shadow-inner select-all">
                {googleScriptCode}
              </pre>
              <div className="absolute top-2 right-2 bg-zinc-800 text-zinc-300 text-[9px] font-mono uppercase font-black tracking-wider px-2 py-0.5 rounded border border-zinc-700 pointer-events-none">
                Google Apps Script
              </div>
            </div>
          </div>

          {/* Standard persistence block */}
          <div className="bg-white p-8 rounded-3xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] max-w-4xl">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 mb-6 flex items-center gap-2">
              <Database size={18} className="text-zinc-900" /> Yerel Veri Yedekleme ve Yonetim
            </h3>
            <div className="flex flex-col md:flex-row items-center justify-start gap-4">
              <button onClick={manualDownload} className="flex items-center gap-2 px-5 py-3 bg-zinc-900 text-white text-xs font-bold uppercase rounded-xl hover:bg-zinc-850 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer">
                <Download size={14} /> JSON Olarak Indir (Yedek)
              </button>
              <input
                type="file"
                ref={importInputRef}
                onChange={(e) => {
                  if (e.target.files?.[0]) importFromJson(e.target.files[0]);
                  e.target.value = "";
                }}
                className="hidden"
                accept=".json"
              />
              <button onClick={() => importInputRef.current?.click()} className="flex items-center gap-2 px-5 py-3 bg-white text-zinc-900 border-2 border-zinc-900 text-xs font-bold uppercase rounded-xl hover:bg-zinc-50 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer">
                <UploadCloud size={14} /> JSON'dan Yukle
              </button>
              <button onClick={clearAllData} className="flex items-center gap-2 px-5 py-3 text-zinc-950 bg-rose-200 border-2 border-zinc-900 text-xs font-black uppercase rounded-xl hover:bg-rose-300 transition md:ml-auto shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer">
                <Trash2 size={14} /> Tum Verileri Temizle
              </button>
            </div>
            <p className="text-[11px] font-mono text-zinc-400 mt-6 bg-zinc-50 p-4 rounded-xl border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
               ✓ Verileriniz tarayici veritabanina (Local Storage) otomatik kaydedilmektedir. Sayfa yenilendiginde veriler korunur.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
