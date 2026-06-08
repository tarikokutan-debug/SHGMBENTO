import React from "react";
import { X } from "lucide-react";

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  editGroupData: any;
  setEditGroupData: React.Dispatch<React.SetStateAction<any>>;
  onSave: (e: React.FormEvent) => void;
  APP_TYPES: Array<{ id: string; label: string }>;
}

export default function EditGroupModal({
  isOpen,
  onClose,
  editGroupData,
  setEditGroupData,
  onSave,
  APP_TYPES,
}: EditGroupModalProps) {
  if (!isOpen) return null;

  const handleEditFlightChange = (id: string | number, field: string, value: any) => {
    setEditGroupData((prev: any) => ({
      ...prev,
      flights: prev.flights.map((f: any) => (f.id === id ? { ...f, [field]: value } : f)),
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-5 flex justify-between items-center border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Basvuruyu Duzenle</h2>
          <button onClick={onClose} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSave} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50 space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/3">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">AFTN Numarasi</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl font-mono uppercase text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                  value={editGroupData.aftnNo || ""}
                  onChange={e => setEditGroupData({ ...editGroupData, aftnNo: String(e.target.value).toUpperCase() })}
                />
              </div>
              <div className="w-full md:w-1/3">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Basvuru Turu</label>
                <select
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 font-medium"
                  value={editGroupData.appType || "yeniPermi"}
                  onChange={e => setEditGroupData({ ...editGroupData, appType: e.target.value })}
                >
                  {APP_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto shadow-sm pb-4">
              <table className="w-full text-left text-sm min-w-max">
                <thead className="bg-gray-50/50 border-b border-gray-100 text-xs text-gray-500 font-medium">
                  <tr>
                    <th className="p-3 pl-4">Havayolu</th>
                    <th className="p-3">Sefer</th>
                    <th className="p-3">Tarih</th>
                    <th className="p-3">Parkur</th>
                    <th className="p-3">STD / STA</th>
                    <th className="p-3">AWB No</th>
                    <th className="p-3">DG?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {editGroupData.flights.map((f: any) => (
                    <tr key={f.id}>
                      <td className="p-2 pl-4">
                        <input
                          className="w-12 p-1.5 bg-gray-50 border border-transparent hover:border-gray-200 focus:bg-white focus:border-gray-300 rounded uppercase outline-none text-xs"
                          value={f.al || ""}
                          onChange={e => handleEditFlightChange(f.id, "al", e.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          className="w-16 p-1.5 bg-gray-50 border border-transparent hover:border-gray-200 focus:bg-white focus:border-gray-300 rounded uppercase outline-none text-xs"
                          value={f.flNo || ""}
                          onChange={e => handleEditFlightChange(f.id, "flNo", e.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          className="w-28 p-1.5 bg-gray-50 border border-transparent hover:border-gray-200 focus:bg-white focus:border-gray-300 rounded outline-none text-xs"
                          value={f.date || ""}
                          onChange={e => handleEditFlightChange(f.id, "date", e.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <input
                            className="w-12 p-1.5 bg-gray-50 border border-transparent hover:border-gray-200 focus:bg-white focus:border-gray-300 rounded uppercase outline-none text-xs"
                            value={f.orig || ""}
                            onChange={e => handleEditFlightChange(f.id, "orig", e.target.value)}
                          />
                          <input
                            className="w-12 p-1.5 bg-gray-50 border border-transparent hover:border-gray-200 focus:bg-white focus:border-gray-300 rounded uppercase outline-none text-xs"
                            value={f.dest || ""}
                            onChange={e => handleEditFlightChange(f.id, "dest", e.target.value)}
                          />
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <input
                            className="w-12 p-1.5 bg-gray-50 border border-transparent hover:border-gray-200 focus:bg-white focus:border-gray-300 rounded outline-none text-xs"
                            value={f.std || ""}
                            onChange={e => handleEditFlightChange(f.id, "std", e.target.value)}
                          />
                          <input
                            className="w-12 p-1.5 bg-gray-50 border border-transparent hover:border-gray-200 focus:bg-white focus:border-gray-300 rounded outline-none text-xs"
                            value={f.sta || ""}
                            onChange={e => handleEditFlightChange(f.id, "sta", e.target.value)}
                          />
                        </div>
                      </td>
                      <td className="p-2">
                        <input
                          className="w-24 p-1.5 bg-gray-50 border border-transparent hover:border-gray-200 focus:bg-white focus:border-gray-300 rounded outline-none text-xs"
                          placeholder="Yok"
                          value={f.awbNo || ""}
                          onChange={e => handleEditFlightChange(f.id, "awbNo", e.target.value)}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          checked={f.isDg || false}
                          onChange={e => handleEditFlightChange(f.id, "isDg", e.target.checked)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-5 border-t border-gray-100 bg-white flex justify-end gap-2 shrink-0">
            <button type="button" onClick={onClose} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-sm font-medium transition">
              Iptal
            </button>
            <button type="submit" className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition shadow-sm">
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
