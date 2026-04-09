import React, { useEffect, useState } from "react";
import axios from "@/lib/axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from "recharts";
import Sidebar from "@/components/Sidebar";
import { RefreshCw, Filter, LayoutDashboard } from "lucide-react";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const STATUS_COLORS = {
  online: '#10b981', // emerald-500
  idle: '#f59e0b',   // amber-500
  offline: '#ef4444', // red-500
  default: '#94a3b8' // slate-400
};

export default function Analytics() {
  const [filterOptions, setFilterOptions] = useState({
    sites: [],
    departments: [],
    pics: [],
    devices: [],
  });
  
  const [filters, setFilters] = useState({
    site: "",
    department: "",
    pic: "",
    device: "",
  });

  const [dashboardData, setDashboardData] = useState({
    assetStats: [],
    pcStats: [],
    performance: { avgCpu: 0, avgRam: 0, avgDisk: 0 },
  });

  const [loading, setLoading] = useState(true);

  const fetchFilters = async () => {
    try {
      const res = await axios.get(`/api/analytics/filters`);
      setFilterOptions(res.data);
    } catch (err) {
      console.error("Gagal fetch filters:", err);
    }
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters).toString();
      const res = await axios.get(`/api/analytics/dashboard?${params}`);
      setDashboardData(res.data);
    } catch (err) {
      console.error("Gagal fetch dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const perfData = [
    { name: "CPU", value: Math.round(dashboardData.performance.avgCpu || 0) },
    { name: "RAM", value: Math.round(dashboardData.performance.avgRam || 0) },
    { name: "Disk", value: Math.round(dashboardData.performance.avgDisk || 0) },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200/60 px-8 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                 <LayoutDashboard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-800 tracking-tight">Analytics Dashboard</h2>
                <p className="text-sm text-zinc-500 mt-0.5">Filter and monitor system-wide asset performance</p>
              </div>
            </div>
            <button
              onClick={fetchDashboard}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6 max-w-7xl mx-auto">
          {/* Filters Area */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4 text-zinc-800 font-semibold border-b border-zinc-100 pb-3">
              <Filter className="w-5 h-5 text-indigo-500" />
              <span>Filters</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">Site</label>
                <select name="site" value={filters.site} onChange={handleFilterChange} className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-700 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer">
                  <option value="">All Sites</option>
                  {filterOptions.sites.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">Department</label>
                <select name="department" value={filters.department} onChange={handleFilterChange} className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-700 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer">
                  <option value="">All Departments</option>
                  {filterOptions.departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">PIC</label>
                <select name="pic" value={filters.pic} onChange={handleFilterChange} className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-700 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer">
                  <option value="">All PICs</option>
                  {filterOptions.pics.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">Device (FA Number)</label>
                <select name="device" value={filters.device} onChange={handleFilterChange} className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-700 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer">
                  <option value="">All Devices</option>
                  {filterOptions.devices.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Charts Area */}
          <div className="relative min-h-[300px]">
            {loading && (
               <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm rounded-2xl flex justify-center items-center text-indigo-500">
                 <RefreshCw className="w-8 h-8 animate-spin" />
               </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Asset Status Chart */}
              <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm p-6 flex flex-col items-center">
                <div className="w-full border-b border-zinc-100 pb-3 mb-6">
                   <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest text-center">Asset Types Overview</h3>
                </div>
                {dashboardData.assetStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={dashboardData.assetStats} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} fill="#8884d8" paddingAngle={5} label>
                        {dashboardData.assetStats.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-sm text-slate-400">No data available</div>
                )}
              </div>

              {/* PC Status Chart */}
              <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm p-6 flex flex-col items-center">
                <div className="w-full border-b border-zinc-100 pb-3 mb-6">
                   <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest text-center">Agent Status Breakdown</h3>
                </div>
                {dashboardData.pcStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={dashboardData.pcStats} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} label>
                        {dashboardData.pcStats.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name.toLowerCase()] || STATUS_COLORS.default} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-sm text-slate-400">No data available</div>
                )}
              </div>

              {/* Performance Chart */}
              <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm p-6 flex flex-col items-center">
                <div className="w-full border-b border-zinc-100 pb-3 mb-6">
                   <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest text-center">Average Performance</h3>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={perfData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                    <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val) => `${val}%`} />
                    <Bar dataKey="value" name="Usage" radius={[6, 6, 0, 0]}>
                      {perfData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.value > 85 ? '#ef4444' : entry.value > 65 ? '#f59e0b' : '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
