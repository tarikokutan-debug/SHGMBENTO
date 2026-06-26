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
  Check,
  Paintbrush,
  Sparkles,
  Plane,
  History,
  Clock,
  AlertTriangle
} from "lucide-react";

interface SettingsViewProps {
  settingsTab: "EMAILS" | "FEES" | "THEMES" | "DATA";
  setSettingsTab: (tab: "EMAILS" | "FEES" | "THEMES" | "DATA") => void;
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
  
  // Theme props
  theme: "THY" | "APPLE";
  setTheme: (theme: "THY" | "APPLE") => void;

  // Backup history props
  backupLogs: any[];
  lastBackupTime: string | null;
  clearBackupLogs: () => void;
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
  
  theme,
  setTheme,

  backupLogs,
  lastBackupTime,
  clearBackupLogs,
}: SettingsViewProps) {

  return (
    <div className="animate-fade-in space-y-6">
      {/* Sub tabs inside Settings */}
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
          onClick={() => setSettingsTab("THEMES")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${settingsTab === "THEMES" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"}`}
        >
          <Paintbrush size={14} /> Tema Seçimi
        </button>
        <button
          onClick={() => setSettingsTab("DATA")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${settingsTab === "DATA" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"}`}
        >
          <Database size={14} /> Veri ve Yedekleme
        </button>
      </div>

      {/* 1. EMAILS TAB */}
      {settingsTab === "EMAILS" && (
        <div className="bg-white p-8 rounded-3xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 border-2 border-zinc-900 p-5 rounded-2xl flex flex-col items-center justify-center shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
              <span className="text-zinc-500 text-[10px] font-black uppercase font-mono tracking-wider mb-1">Toplam Istasyon</span>
              <span className="text-4xl font-extrabold text-zinc-900 font-mono">{Object.keys(stationEmails).length}</span>
            </div>
            <div className="bg-emerald-50 border-2 border-zinc-900 p-5 rounded-2xl flex flex-col items-center justify-center shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
              <span className="text-zinc-500 text-[10px] font-black uppercase font-mono tracking-wider mb-1">Kayitli Mail Adresi</span>
              <span className="text-4xl font-extrabold text-zinc-900 font-mono">{Object.values(stationEmails).reduce((acc: number, arr: any) => acc + arr.length, 0)}</span>
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
                    <div className="text-xs text-zinc-400">Kayitli mail yok.</div>
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

      {/* 2. FEES TAB */}
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

      {/* 3. THEMES TAB (NEW FEATURE) */}
      {settingsTab === "THEMES" && (
        <div className="bg-white p-8 rounded-3xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] max-w-4xl">
          <div className="flex items-center gap-3 border-b-2 border-zinc-900 pb-4 mb-6">
            <div className="bg-red-50 text-red-600 border-2 border-zinc-900 p-2 rounded-xl shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <Paintbrush size={20} />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wider text-zinc-900">Uygulama Teması</h3>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wide">SHGM takip ekranlarını THY kurumsal kimliğine veya Apple minimalist tasarımına uyarlayın.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            {/* Theme 1: THY */}
            <div 
              onClick={() => setTheme("THY")}
              className={`cursor-pointer rounded-2xl border-2 p-5 flex flex-col justify-between transition-all relative ${theme === "THY" ? "border-zinc-900 bg-zinc-50 ring-2 ring-red-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" : "border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50/50"}`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded font-mono flex items-center gap-1">
                    <Plane size={11} /> Türk Hava Yolları
                  </span>
                  {theme === "THY" && <Check size={16} className="text-red-600" />}
                </div>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">THY kurumsal renkleri (Kırmızı & Gece Mavisi), zarif 1px kenarlıklar, yumuşak gölgeler ve modern kurumsal font.</p>
              </div>
              <div className="mt-8 border border-gray-200 bg-white rounded-lg p-3 flex flex-col gap-1.5 shadow-md">
                <div className="w-10 h-3 bg-[#0B1930] rounded"></div>
                <div className="w-full h-1 bg-gray-100"></div>
                <div className="w-1/2 h-1.5 bg-[#C8102E] rounded"></div>
              </div>
            </div>

            {/* Theme 2: APPLE */}
            <div 
              onClick={() => setTheme("APPLE")}
              className={`cursor-pointer rounded-2xl border-2 p-5 flex flex-col justify-between transition-all relative ${theme === "APPLE" ? "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" : "border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50/50"}`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-200 px-2 py-0.5 rounded font-mono flex items-center gap-1">
                    <Sparkles size={11} /> Apple Minimal
                  </span>
                  {theme === "APPLE" && <Check size={16} className="text-zinc-850" />}
                </div>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">Süper ince kenarlıklar, ultra-hafif gölgeler, saf beyaz bento kartları, geniş boşluklar ve Apple sistem fontu.</p>
              </div>
              <div className="mt-8 border border-gray-100/60 bg-white rounded-lg p-3 flex flex-col gap-1.5 shadow-sm">
                <div className="w-10 h-3 bg-zinc-900 rounded-full"></div>
                <div className="w-full h-1 bg-zinc-100"></div>
                <div className="w-1/2 h-1.5 bg-zinc-900 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. DATA TAB */}
      {settingsTab === "DATA" && (
        <div className="space-y-8 animate-fade-in max-w-4xl">
          {/* Standard persistence block */}
          <div className="bg-white p-8 rounded-3xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 mb-6 flex items-center gap-2">
              <Database size={18} className="text-zinc-900" /> Yerel Veri Yedekleme ve Yönetim
            </h3>
            <div className="flex flex-col md:flex-row items-center justify-start gap-4">
              <button onClick={manualDownload} className="flex items-center gap-2 px-5 py-3 bg-zinc-900 text-white text-xs font-bold uppercase rounded-xl hover:bg-zinc-850 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer w-full md:w-auto justify-center">
                <Download size={14} /> JSON Olarak İndir (Yedek)
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
              <button onClick={() => importInputRef.current?.click()} className="flex items-center gap-2 px-5 py-3 bg-white text-zinc-900 border-2 border-zinc-900 text-xs font-bold uppercase rounded-xl hover:bg-zinc-50 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer w-full md:w-auto justify-center">
                <UploadCloud size={14} /> JSON'dan Yükle
              </button>
              <button onClick={clearAllData} className="flex items-center gap-2 px-5 py-3 text-zinc-950 bg-rose-200 border-2 border-zinc-900 text-xs font-black uppercase rounded-xl hover:bg-rose-300 transition md:ml-auto shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer w-full md:w-auto justify-center">
                <Trash2 size={14} /> Tüm Verileri Temizle
              </button>
            </div>
            <p className="text-[11px] font-mono text-zinc-400 mt-6 bg-zinc-50 p-4 rounded-xl border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
               ✓ Verileriniz tarayıcı veritabanına (Local Storage) otomatik kaydedilmektedir. İnternet bağlantısı olmasa dahi hiçbir veri kaybolmaz.
            </p>
          </div>

          {/* Yedekleme Geçmişi Paneli */}
          <div className="bg-white p-8 rounded-3xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b-2 border-zinc-900 pb-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                  <History size={18} className="text-zinc-900" /> Yedekleme Geçmişi
                </h3>
                <p className="text-xs text-zinc-500 mt-1">Uygulamanın yedek indirme, yükleme ve sıfırlama işlemleri günlüğü.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border-2 border-zinc-900 px-3 py-1.5 rounded-xl text-xs font-bold font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Clock size={13} />
                  <span>Son Başarılı: {lastBackupTime || "Hiç yedek alınmadı"}</span>
                </div>
                {backupLogs.length > 0 && (
                  <button 
                    onClick={clearBackupLogs} 
                    className="flex items-center gap-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-2 border-zinc-900 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                  >
                    <Trash2 size={13} /> Günlüğü Temizle
                  </button>
                )}
              </div>
            </div>

            {backupLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-300 text-zinc-400">
                <History size={32} className="stroke-1 mb-2 text-zinc-400" />
                <p className="text-xs font-bold uppercase tracking-wider">Henüz kayıtlı bir yedekleme işlemi bulunmuyor.</p>
                <p className="text-[10px] font-medium mt-1">Sistem verilerini yedeklemek için yukarıdaki "JSON Olarak İndir" butonunu kullanabilirsiniz.</p>
              </div>
            ) : (
              <div className="border-2 border-zinc-900 rounded-2xl overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="max-h-64 overflow-y-auto divide-y-2 divide-zinc-900">
                  {backupLogs.map((log) => {
                    const typeLabel = {
                      MANUAL: "Manuel Yedek",
                      AUTO: "Otomatik Yedek",
                      IMPORT: "Veri Yükleme",
                      CLEAR: "Sistem Sıfırlama"
                    }[log.type as "MANUAL" | "AUTO" | "IMPORT" | "CLEAR"] || log.type;

                    const isSuccess = log.status === "SUCCESS";

                    return (
                      <div key={log.id} className={`p-4 flex items-start gap-3 text-xs transition-colors hover:bg-zinc-50/40 ${isSuccess ? "bg-white" : "bg-red-50/40"}`}>
                        <div className="mt-0.5 shrink-0">
                          {isSuccess ? (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black font-mono">✓</span>
                          ) : (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-black font-mono">!</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-4 mb-0.5">
                            <span className={`font-black uppercase tracking-wider text-[10px] px-2 py-0.5 rounded border border-zinc-900 ${
                              log.type === "MANUAL" ? "bg-blue-100 text-blue-900" :
                              log.type === "AUTO" ? "bg-amber-100 text-amber-900" :
                              log.type === "IMPORT" ? "bg-purple-100 text-purple-900" :
                              "bg-red-100 text-red-900"
                            }`}>
                              {typeLabel}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500 font-medium">
                              {new Date(log.timestamp).toLocaleString("tr-TR")}
                            </span>
                          </div>
                          <p className="font-semibold text-zinc-750 break-words">{log.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
