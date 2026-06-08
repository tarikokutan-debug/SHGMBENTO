import React from "react";
import { BellRing, X } from "lucide-react";
import { Flight } from "../types";

interface DevirModalProps {
  isOpen: boolean;
  onClose: () => void;
  devirGroupData: Record<string, Flight[]>;
  onSendMail: () => void;
}

export default function DevirModal({
  isOpen,
  onClose,
  devirGroupData,
  onSendMail,
}: DevirModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="px-6 py-5 flex justify-between items-center border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BellRing size={18} className="text-[#C8102E]" /> SHGM Nocet Devir Maili
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 bg-gray-50/50 flex-1 space-y-4">
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            Nobet devir maili; durum kodu <strong>BASVURU YAPILDI (APP_MADE)</strong> olan ve ucus tarihi bugun ile yarin arasindaki aktif talepleri icerir.
          </p>
          <div className="bg-white p-4 rounded-xl border border-gray-200 max-h-60 overflow-y-auto font-mono text-[11px] text-gray-700 space-y-2">
            {Object.keys(devirGroupData).length > 0 ? (
              Object.entries(devirGroupData).map(([aftn, flights]) => (
                <div key={aftn} className="border-b border-gray-50 pb-2 last:border-0">
                  <span className="font-bold text-[#C8102E]">[AFTN: {aftn}]</span>
                  {flights.map((f, idx) => (
                    <div key={idx} className="pl-2 text-gray-600">
                      - {f.al || "TK"}{f.flNo} | {f.date} | {f.orig}-{f.dest}
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 italic py-4">Devredilecek uygun kriterde islem bulunmamaktadir.</div>
            )}
          </div>
        </div>
        <div className="p-5 border-t border-gray-100 bg-white flex justify-end gap-2">
          <button onClick={onClose} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-sm font-medium transition">
            Iptal
          </button>
          <button
            onClick={onSendMail}
            disabled={Object.keys(devirGroupData).length === 0}
            className="px-6 py-2 bg-[#C8102E] hover:bg-red-700 text-white rounded-xl text-sm font-medium transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Outlook'a Aktar
          </button>
        </div>
      </div>
    </div>
  );
}
