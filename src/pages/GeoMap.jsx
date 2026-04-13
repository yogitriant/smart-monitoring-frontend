import React, { useEffect, useState, useMemo } from "react";
import axios from "@/lib/axios";
import Sidebar from "@/components/Sidebar";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Globe, RefreshCw, Filter, Monitor, MapPin } from "lucide-react";

// ─── Custom Marker Icons ───────────────────────────────
function createIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
    <circle cx="14" cy="14" r="6" fill="#fff"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
    className: "custom-marker-icon",
  });
}

const ICONS = {
  online: createIcon("#10b981"),
  idle: createIcon("#f59e0b"),
  offline: createIcon("#ef4444"),
};

// ─── Fit Bounds Component ──────────────────────────────
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [positions, map]);
  return null;
}

// ─── Status Badge ──────────────────────────────────────
function StatusBadge({ status }) {
  const config = {
    online: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
    idle: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
    offline: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  };
  const c = config[status] || config.offline;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}

// ─── Main Component ────────────────────────────────────
export default function GeoMap() {
  const [data, setData] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ site: "", status: "" });

  const fetchMapData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.site) params.set("site", filters.site);
      if (filters.status) params.set("status", filters.status);
      const res = await axios.get(`/api/geolocation/map?${params}`);
      setData(res.data.mapData || []);
      setSites(res.data.sites || []);
    } catch (err) {
      console.error("❌ Gagal fetch geo data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, [filters]);

  const positions = useMemo(
    () => data.filter(p => p.lat && p.lng).map(p => [p.lat, p.lng]),
    [data]
  );

  // Summary stats
  const stats = useMemo(() => {
    const online = data.filter(d => d.status === "online").length;
    const idle = data.filter(d => d.status === "idle").length;
    const offline = data.filter(d => d.status === "offline").length;
    return { online, idle, offline, total: data.length };
  }, [data]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-[1000] bg-white/80 backdrop-blur-md border-b border-zinc-200/60 px-8 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-teal-100 p-2 rounded-lg text-teal-600">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-800 tracking-tight">Geo Map</h2>
                <p className="text-sm text-zinc-500 mt-0.5">
                  Pelacakan lokasi fisik aset secara real-time
                </p>
              </div>
            </div>
            <button
              onClick={fetchMapData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-all shadow-sm disabled:opacity-70"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-6 gap-4 overflow-hidden">
          {/* Filters + Stats Bar */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-white border border-zinc-200/80 rounded-xl shadow-sm p-3 flex items-center gap-3">
              <Filter className="w-4 h-4 text-teal-500" />
              <select
                value={filters.site}
                onChange={(e) => setFilters({ ...filters, site: e.target.value })}
                className="bg-slate-50 border border-slate-200 text-sm text-slate-700 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
              >
                <option value="">All Sites</option>
                {sites.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="bg-slate-50 border border-slate-200 text-sm text-slate-700 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="online">🟢 Online</option>
                <option value="idle">🟡 Idle</option>
                <option value="offline">🔴 Offline</option>
              </select>
            </div>

            {/* Summary Cards */}
            <div className="flex gap-2 ml-auto">
              <div className="bg-white border border-zinc-200/80 rounded-xl shadow-sm px-4 py-2 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-bold text-zinc-800">{stats.total}</span>
                <span className="text-xs text-zinc-400">Total</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-bold text-emerald-700">{stats.online}</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-sm font-bold text-amber-700">{stats.idle}</span>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm font-bold text-red-700">{stats.offline}</span>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="flex-1 relative rounded-2xl overflow-hidden border border-zinc-200/80 shadow-sm bg-white">
            {loading && (
              <div className="absolute inset-0 z-[999] bg-white/60 backdrop-blur-sm flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
              </div>
            )}

            {data.length === 0 && !loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400">
                <MapPin className="w-16 h-16 mb-4 text-zinc-300" />
                <p className="text-lg font-medium">Belum ada data lokasi</p>
                <p className="text-sm mt-1">
                  Pastikan RegionSiteItem memiliki koordinat (lat/lng) yang sudah diisi
                </p>
              </div>
            ) : (
              <MapContainer
                center={[-6.2, 106.8]}
                zoom={5}
                className="w-full h-full"
                style={{ minHeight: "400px" }}
                zoomControl={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                />

                {positions.length > 0 && <FitBounds positions={positions} />}

                {data.filter(p => p.lat && p.lng).map((pc) => (
                  <Marker
                    key={pc._id}
                    position={[pc.lat, pc.lng]}
                    icon={ICONS[pc.status] || ICONS.offline}
                  >
                    <Popup maxWidth={300} className="geo-popup">
                      <div className="min-w-[240px]">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-zinc-800 text-sm">{pc.hostname}</span>
                          <StatusBadge status={pc.status} />
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs border-t border-zinc-100 pt-2">
                          <div>
                            <span className="text-zinc-400 block">PC ID</span>
                            <span className="text-zinc-700 font-medium">{pc.pcId}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block">Owner</span>
                            <span className="text-zinc-700 font-medium">{pc.owner}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block">Site</span>
                            <span className="text-zinc-700 font-medium">{pc.site}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block">IP Address</span>
                            <span className="text-zinc-700 font-medium">{pc.ipAddress || "-"}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block">FA Number</span>
                            <span className="text-zinc-700 font-medium">{pc.faNumber}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block">User Login</span>
                            <span className="text-zinc-700 font-medium">{pc.userLogin}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-zinc-400 block">Product</span>
                            <span className="text-zinc-700 font-medium">{pc.productName}</span>
                          </div>
                          <div className="col-span-2 mt-1 pt-1 border-t border-zinc-100">
                            <span className="text-zinc-400 block">📍 Lokasi</span>
                            <span className="text-zinc-700 font-medium">{pc.geoCity}</span>
                            <span className="text-zinc-400 ml-1 text-[10px]">({pc.geoSource})</span>
                          </div>
                          {pc.lastActive && (
                            <div className="col-span-2">
                              <span className="text-zinc-400 block">Last Active</span>
                              <span className="text-zinc-700 font-medium">
                                {new Date(pc.lastActive).toLocaleString("id-ID", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>
        </div>
      </div>

      {/* Global Leaflet styles override */}
      <style>{`
        .custom-marker-icon {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1) !important;
          border: 1px solid #e4e4e7 !important;
        }
        .leaflet-popup-tip {
          box-shadow: none !important;
        }
        .leaflet-popup-content {
          margin: 12px 14px !important;
        }
      `}</style>
    </div>
  );
}
