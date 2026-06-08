import React from "react";
import { X, CheckCircle } from "lucide-react";
import { Flight } from "../types";

interface MailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFlightForMail: any | null;
  excelPasteContent: string;
  onExcelPasteChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  parsedTableData: string[][];
  calculatedRecipients: string;
  onSendEmail: () => void;
  formatForMail: (dStr: string) => string;
  SPECIAL_DESTINATIONS: string[];
}

export default function MailPreviewModal({
  isOpen,
  onClose,
  selectedFlightForMail,
  excelPasteContent,
  onExcelPasteChange,
  parsedTableData,
  calculatedRecipients,
  onSendEmail,
  formatForMail,
  SPECIAL_DESTINATIONS,
}: MailPreviewModalProps) {
  if (!isOpen || !selectedFlightForMail) return null;

  const flightsToMail = selectedFlightForMail.flights || [selectedFlightForMail];
  const mailDisplayFlight = flightsToMail[0] || {};
  const mailDate = formatForMail(mailDisplayFlight.date || "");
  const targetDest = String(mailDisplayFlight.dest || "").toUpperCase().trim();
  const isSpecialDest = SPECIAL_DESTINATIONS.includes(targetDest);

  let flightCode = "";
  if (isSpecialDest) {
    flightCode = targetDest + " Turkish Civil Aviation Permission";
  } else {
    const dateRawStr = String(mailDisplayFlight.date || "");
    flightCode = (dateRawStr.includes("-") || dateRawStr.includes(" ")) ? "DONEMSEL DEGISIKLIK" : "MUNFERIT DEGISIKLIK";
  }
  const route = isSpecialDest ? `${String(mailDisplayFlight.orig || "IST")}-${targetDest}` : "COKLU PARKUR";

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 flex justify-between items-center border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Mail Hazirla</h2>
            <p className="text-xs text-gray-500">
              {mailDisplayFlight.al || "TK"}{mailDisplayFlight.flNo || ""} • {mailDisplayFlight.date || ""}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 flex flex-col lg:flex-row gap-6 bg-gray-50/50">
          <div className="flex-1 flex flex-col">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Veri Yapistir (235.. / FROM / TO)</label>
            <div className="relative flex-1">
              <textarea
                className="w-full h-full min-h-[250px] p-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-200 font-mono text-xs resize-none shadow-sm"
                placeholder="Buraya yapistirin..."
                value={excelPasteContent}
                onChange={onExcelPasteChange}
              ></textarea>
              {parsedTableData.length > 0 && (
                <div className="absolute bottom-4 right-4 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> {parsedTableData.length} Satir
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col h-full shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Onizleme</h3>
              <div className="flex-1 bg-gray-50 rounded-xl p-4 text-xs text-gray-600 overflow-y-auto border border-gray-100 leading-relaxed">
                <p>Dear all concerned, </p><br />
                <p>To apply for Turkish Civil Aviation Permission, we require one signed and stamped copy of <strong>the AWB and the corresponding signed and stamped Invoice</strong> for the flight listed below:</p>
                <div className="my-2 p-2 bg-yellow-100/50 text-gray-900 font-medium text-xs rounded border border-yellow-200/50 inline-block">&gt;&gt;&gt; {mailDate} {flightCode} {route} &lt;&lt;&lt;</div>
                <div className="mb-2"><strong className="text-red-500 text-xs">*** IMPORTANT ***:</strong> Please ensure that the Flight Date and Flight Number on the AWB and Invoice exactly match the requested details below (<strong>{mailDate} {flightCode}</strong>).</div>
                {parsedTableData.length > 0 ? (
                  <div className="my-3 border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left bg-white">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                        <tr>
                          <th className="p-1.5 px-2">AWB</th>
                          <th className="p-1.5 px-2">FROM</th>
                          <th className="p-1.5 px-2">TO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {parsedTableData.map((row, i) => (
                          <tr key={i}>
                            <td className="p-1.5 px-2">{String(row[0] || "")}</td>
                            <td className="p-1.5 px-2 font-medium text-[#C8102E]">{String(row[1] || "")}</td>
                            <td className="p-1.5 px-2">{String(row[2] || "")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <span className="text-gray-400 italic my-3 block">[Veri tablosu buraya gelecek...]</span>
                )}
                <p>Requirements:<br />1. Both the AWB and Invoice must be signed and stamped.<br />2. Please ensure the AWB includes the IATA Agent's Code.</p><br /><p>Thank you in advance for your cooperation.</p>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Alicilar</h4>
                <p className="text-[10px] text-gray-700 font-medium truncate">{calculatedRecipients || "(Bekleniyor...)"}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-gray-100 bg-white flex justify-end gap-2 shrink-0">
          <button onClick={onClose} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-sm font-medium transition">Iptal</button>
          <button onClick={onSendEmail} disabled={parsedTableData.length === 0} className={`px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium transition shadow-sm ${parsedTableData.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"}`}>Outlook'u Ac</button>
        </div>
      </div>
    </div>
  );
}
