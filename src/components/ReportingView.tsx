import React from "react";
import { BarChart2, Users, AlertTriangle } from "lucide-react";

interface ReportingViewProps {
  reportMetrics: any;
  monthlyAftnTrend: any[];
  stationDensity: any[];
  statusDistribution: any[];
  weekdayAftnDensity: any[];
}

export default function ReportingView({
  reportMetrics,
  monthlyAftnTrend,
  stationDensity,
  statusDistribution,
  weekdayAftnDensity,
}: ReportingViewProps) {
  return (
    <div className="animate-fade-in space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-emerald-50 p-5 rounded-2xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between h-36 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] transition-all">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider font-mono">Toplam Onay</span>
              <span className="text-[9px] text-zinc-400 font-bold uppercase mt-1">AFTN</span>
            </div>
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-zinc-900" />
          </div>
          <div className="text-3xl font-extrabold italic text-zinc-900 font-mono leading-none">{reportMetrics.totalApproved}</div>
        </div>

        <div className="bg-purple-50 p-5 rounded-2xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between h-36 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] transition-all">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider font-mono">Toplam Bedel</span>
              <span className="text-[9px] text-zinc-400 font-bold uppercase mt-1">{reportMetrics.totalApplications} Basvuru</span>
            </div>
            <span className="w-3 h-3 rounded-full bg-purple-500 border border-zinc-900" />
          </div>
          <div className="text-2xl font-extrabold text-zinc-900 font-mono leading-none tracking-tight">{reportMetrics.totalCost}</div>
        </div>

        <div className="bg-blue-50 p-5 rounded-2xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between h-36 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] transition-all">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider font-mono">Ort. Sure</span>
              <span className="text-[9px] text-zinc-400 font-bold uppercase mt-1">Basvuru-Onay</span>
            </div>
            <span className="w-3 h-3 rounded-full bg-blue-550 border border-zinc-900" />
          </div>
          <div className="text-2xl font-extrabold text-zinc-900 font-mono leading-none tracking-tight">{reportMetrics.avgApprovalTime}</div>
        </div>

        <div className="bg-amber-50 p-5 rounded-2xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between h-36 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] transition-all">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider font-mono">Bekleyen</span>
              <span className="text-[9px] text-zinc-400 font-bold uppercase mt-1">AFTN</span>
            </div>
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-zinc-900" />
          </div>
          <div className="text-3xl font-extrabold italic text-zinc-900 font-mono leading-none">{reportMetrics.pendingApprovals}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between h-36 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] transition-all">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider font-mono">Toplam Program</span>
              <span className="text-[9px] text-zinc-400 font-bold uppercase mt-1">Tarife</span>
            </div>
            <span className="w-3 h-3 rounded-full bg-indigo-500 border border-zinc-900" />
          </div>
          <div className="text-3xl font-extrabold italic text-zinc-900 font-mono leading-none">{reportMetrics.totalSchedules}</div>
        </div>

        <div className="bg-orange-50 p-5 rounded-2xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between h-36 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] transition-all">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider font-mono">Iptal Edilen</span>
              <span className="text-[9px] text-zinc-400 font-bold uppercase mt-1">AFTN</span>
            </div>
            <span className="w-3 h-3 rounded-full bg-orange-400 border border-zinc-900" />
          </div>
          <div className="text-3xl font-extrabold italic text-zinc-900 font-mono leading-none">{reportMetrics.cancelledCount}</div>
        </div>

        <div className="bg-red-50 p-5 rounded-2xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between h-36 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] transition-all">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider font-mono">Reddedilen</span>
              <span className="text-[9px] text-zinc-400 font-bold uppercase mt-1">AFTN</span>
            </div>
            <span className="w-3 h-3 rounded-full bg-red-500 border border-zinc-900" />
          </div>
          <div className="text-3xl font-extrabold italic text-zinc-900 font-mono leading-none">{reportMetrics.rejectedCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trend Bar Chart */}
        <div className="bg-white p-8 rounded-3xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col min-h-[450px]">
          <div className="flex items-center gap-2 mb-6 text-zinc-900 font-bold text-sm uppercase tracking-wider font-mono">
            <BarChart2 size={20} className="text-zinc-900" />
            <span>Son 6 Ay Basvuru Trendi (AFTN)</span>
          </div>
          <div className="flex-1 flex items-end justify-between px-4 pb-4 border-b-2 border-zinc-900 relative">
            {monthlyAftnTrend.map((bar, idx) => {
              const maxVal = Math.max(...monthlyAftnTrend.map(b => b.value), 1);
              const hPct = (bar.value / maxVal) * 100;
              return (
                <div key={idx} className="flex flex-col items-center flex-1 group/bar relative h-full justify-end mx-1">
                  <div className="absolute -top-12 text-[10px] font-mono font-black text-zinc-950 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-amber-200 px-2 py-1.5 border-2 border-zinc-900 rounded-md whitespace-nowrap z-10 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {bar.value} ad.<br /><span className="text-zinc-900">{bar.cost.toLocaleString('tr-TR')} TL</span>
                  </div>
                  <div 
                    style={{ height: `${Math.max(hPct, 8)}%` }} 
                    className="w-full bg-zinc-900 hover:bg-[#C8102E] border-2 border-zinc-900 hover:border-zinc-900 rounded-t-xl transition-all duration-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer max-w-[64px] flex flex-col items-center pt-3"
                  >
                    <span className="text-white text-xs font-black font-mono">{bar.value}</span>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-3 font-mono">{bar.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stations Density Bar Chart */}
        <div className="bg-white p-8 rounded-3xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] min-h-[450px] flex flex-col">
          <div className="flex items-center gap-2 mb-8 text-zinc-900 font-bold text-sm uppercase tracking-wider font-mono">
            <Users size={20} className="text-zinc-900" />
            <span>En Cok Degisiklik Yapilan Istasyonlar</span>
          </div>
          <div className="space-y-6 overflow-y-auto flex-1 pr-2">
            {stationDensity.map((st, idx) => {
              const maxSt = Math.max(...stationDensity.map(s => s.value), 1);
              const wPct = (st.value / maxSt) * 100;
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-zinc-700 font-mono">
                    <span className="bg-zinc-150 border-2 border-zinc-900 px-2 py-0.5 rounded-lg text-zinc-900 font-black">{st.label}</span>
                    <span className="font-mono text-zinc-900 font-bold">{st.value} Ucus</span>
                  </div>
                  <div className="w-full h-4 bg-zinc-100 rounded-full border-2 border-zinc-900 overflow-hidden shadow-inner p-0.5">
                    <div style={{ width: `${wPct}%` }} className="h-full bg-indigo-500 border-r-2 border-zinc-900 rounded-full transition-all duration-500" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Distribution Visual Matrix */}
        <div className="bg-white p-8 rounded-3xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between min-h-[450px] lg:col-span-2">
          <div>
            <div className="flex items-center gap-2 mb-4 text-zinc-900 font-bold text-sm uppercase tracking-wider font-mono">
              <AlertTriangle size={20} className="text-zinc-900" />
              <span>Sureclerin Durum Dagilimi</span>
            </div>
            <div className="flex gap-3 flex-wrap mb-2">
              {statusDistribution.map((sd, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-xl border-2 border-zinc-900 text-xs text-zinc-800 font-bold font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <span className={`w-3.5 h-3.5 rounded-full ${sd.color} border border-zinc-900`} />
                  <span>{sd.label}: {sd.value}</span>
                </div>
              ))}
            </div>
            <div className="w-full h-12 bg-zinc-100 rounded-2xl flex overflow-hidden shadow-inner mt-6 mb-8 border-2 border-zinc-900 p-0.5">
              {(() => {
                const totalStatus = statusDistribution.reduce((sum, item) => sum + item.value, 0);
                return statusDistribution.map((sd, idx) => {
                  const pct = totalStatus > 0 ? ((sd.value / totalStatus) * 100) : 0;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={idx}
                      style={{ width: `${pct}%` }}
                      className={`${sd.color} h-full flex items-center justify-center text-zinc-950 border-r-2 last:border-r-0 border-zinc-900 text-xs font-black font-mono transition-all hover:brightness-105`}
                      title={`${sd.label}: ${sd.value}`}
                    >
                      {pct > 5 ? `%${pct.toFixed(1)}` : ""}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
          <div className="border-t-2 border-zinc-900 pt-6 flex flex-col flex-1 justify-end">
            <div className="text-[10px] font-black font-mono text-zinc-400 uppercase tracking-widest mb-6">Gunlere Gore AFTN Yayilimi</div>
            <div className="flex justify-between items-end flex-1 min-h-[200px] px-2 border-b-2 border-zinc-900 pb-2">
              {weekdayAftnDensity.map((wd, i) => {
                const maxWd = Math.max(...weekdayAftnDensity.map(w => w.value), 1);
                const barH = (wd.value / maxWd) * 100;
                return (
                  <div key={i} className="flex flex-col items-center flex-1 group/wd relative h-full justify-end mx-1">
                    <div 
                      style={{ height: `${Math.max(barH, 8)}%` }} 
                      className="w-full bg-amber-300 hover:bg-amber-400 border-2 border-zinc-900 rounded-t-lg transition-all max-w-[64px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center pt-2 cursor-pointer"
                    >
                      {wd.value > 0 && <span className="text-zinc-950 text-xs font-black font-mono">{wd.value}</span>}
                    </div>
                    <span className="text-xs font-bold text-zinc-600 mt-3 font-mono uppercase text-[9px] tracking-wider">{wd.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
