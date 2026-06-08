import React from "react";
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
  Table as TableIcon
} from "lucide-react";

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
  
  googleSyncStatus,
  lastSyncTime,
  autoSyncEnabled,
  setAutoSyncEnabled,
  handleGooglePull,
  handleGooglePush,
  handleGoogleFullSync,
}: SettingsViewProps) {
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
          {/* Google Sheets Integration Panel */}
          <div className="bg-white p-8 rounded-3xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] max-w-4xl">
            <div className="flex items-center gap-3 border-b-2 border-zinc-900 pb-4 mb-6">
              <div className="bg-emerald-100 text-emerald-800 border-2 border-zinc-900 p-2 rounded-xl shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <TableIcon size={20} />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-zinc-900">Google Sheets Bulut Senkronizasyonu</h3>
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wide">Google E-Tablo entegrasyonu ile verileri guvenle depolayin ve senkronize edin.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-zinc-100 p-4 rounded-xl border-2 border-zinc-900 space-y-2.5 text-xs font-mono">
                <div><span className="font-bold text-zinc-500">API Gateway URL:</span> <code className="font-mono text-blue-700 block truncate" title="Spreadsheet Script API">Spreadsheet Script App Engine Webhook</code></div>
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
                    className="w-5 h-5 rounded border-2 border-zinc-900 text-zinc-905 focus:ring-0 checked:bg-zinc-900"
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

            <div className="flex flex-wrap items-center justify-start gap-3 border-t-2 border-zinc-900 pt-5">
              <button
                onClick={handleGoogleFullSync}
                disabled={googleSyncStatus === "loading" || googleSyncStatus === "saving"}
                className="flex items-center gap-2 px-5 py-3 bg-emerald-300 text-zinc-900 text-xs font-black uppercase tracking-wider border-2 border-zinc-900 rounded-xl hover:bg-emerald-400 transition shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                <RefreshCw size={14} className={googleSyncStatus === "loading" ? "animate-spin" : ""} /> Çift Yönlü Tam Eşitle (Merge)
              </button>
              <button
                onClick={handleGooglePull}
                disabled={googleSyncStatus === "loading" || googleSyncStatus === "saving"}
                className="flex items-center gap-2 px-5 py-3 bg-white text-zinc-900 border-2 border-zinc-900 text-xs font-bold uppercase rounded-xl hover:bg-zinc-50 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 cursor-pointer"
              >
                <Download size={14} /> Buluttan Veri Çek ve Yereli Ez
              </button>
              <button
                onClick={handleGooglePush}
                disabled={googleSyncStatus === "loading" || googleSyncStatus === "saving"}
                className="flex items-center gap-2 px-5 py-3 bg-white text-zinc-900 border-2 border-zinc-900 text-xs font-bold uppercase rounded-xl hover:bg-zinc-50 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 cursor-pointer"
              >
                <UploadCloud size={14} /> Yerel Veriyi Buluta Yaz (Ez)
              </button>
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
