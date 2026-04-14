import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "@/lib/axios";
import Sidebar from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { io } from "socket.io-client";
import dayjs from "dayjs";
import { Combobox } from "@/components/ui/combobox";

let socket;

export default function ComputerDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [pc, setPc] = useState(null);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [specHistory, setSpecHistory] = useState([]);
  const [installedApps, setInstalledApps] = useState([]);
  const [appSearch, setAppSearch] = useState("");
  const [editMode, setEditMode] = useState(false);

  const [form, setForm] = useState({
    // PC fields
    isAdmin: false,
  });

  const [uptimeToday, setUptimeToday] = useState(0);
  const [uptimeSession, setUptimeSession] = useState(0);
  const [uptimeLifetime, setUptimeLifetime] = useState(0);

  const formatDuration = (seconds) => {
    const total = Number(seconds);
    if (isNaN(total) || total <= 0) return "00:00:00";
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = Math.floor(total % 60);
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    socket = io(import.meta.env.VITE_API_BASE_URL);
    socket.on("connect", () => {
      console.log("🧾 Join-dashboard dengan pcId:", id);
      socket.emit("join-dashboard", id);
    });

    socket.on("uptime-update", (data) => {
      if (data) {
        setUptimeToday((prev) => {
          const diff = data.uptimeTotalToday - prev;
          if (diff > 0) setUptimeLifetime((l) => l + diff);
          return data.uptimeTotalToday;
        });
        setUptimeSession(data.uptimeSession);
      }
    });

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const me = JSON.parse(localStorage.getItem("user") || "{}");
        const role = me.role || "";
        const headers = { Authorization: `Bearer ${token}` };

        const [pcRes, locRes, catRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/pc/${id}`, {
            headers,
          }),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/location`, {
            headers,
          }),
          axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/api/location/categories`,
            { headers }
          ),
        ]);

        const data = pcRes.data;
        setPc(data);
        setLocations(locRes.data);
        setCategories(catRes.data);

        setForm({
          // PC fields
          isAdmin: data.isAdmin || false,
        });

        const today = dayjs().format("YYYY-MM-DD");
        const [uptimeTodayRes, uptimeLifetimeRes] = await Promise.all([
          axios.get(
            `${import.meta.env.VITE_API_BASE_URL
            }/api/uptime?pc=${id}&date=${today}`,
            { headers }
          ),
          axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/api/uptime/total/${id}`,
            { headers }
          ),
        ]);
        
        const uptimeData = uptimeTodayRes.data || {};

        setUptimeToday(Number(uptimeData.uptimeTotalToday || 0));
        setUptimeSession(Number(uptimeData.uptimeSession || 0));
        setUptimeLifetime(Number(uptimeLifetimeRes.data?.uptimeLifetime || 0));

        if (role === "admin" || role === "superadmin") {
          const historyRes = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/api/spec-history`,
            { headers }
          );
          setSpecHistory(historyRes.data.filter((item) => item.pc?._id === id));
        }

        // Fetch installed apps
        try {
          const appsRes = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/api/installed-apps/by-id/${id}`,
            { headers }
          );
          setInstalledApps(appsRes.data?.apps || []);
        } catch {
          // No installed apps data yet
        }
      } catch (err) {
        console.error("❌ Gagal fetch detail:", err.message);
      }
    };

    fetchData();

    return () => {
      socket.disconnect();
    };
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = async (e) => {
    const selected = e.target.value;
    setForm({ ...form, category: selected, location: "" });
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/location?category=${selected}`
      );
      setLocations(res.data);
    } catch (err) {
      console.error("❌ Gagal ambil lokasi berdasarkan kategori:", err.message);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const payload = {
        isAdmin: form.isAdmin === true || form.isAdmin === "true",
      };

      console.log("🔼 Payload:", payload);

      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/pc/${id}`,
        payload,
        { headers }
      );

      alert("✅ Data berhasil diperbarui!");
      setEditMode(false);

      const pcDetailRes = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/pc/${id}`,
        { headers }
      );
      setPc(pcDetailRes.data);
      // sinkronkan form sesudah save
      const d = pcDetailRes.data;
      setForm({
        location: d.location?._id || "",
        category: d.location?.category || "",
        isAdmin: d.isAdmin || false,
      });
    } catch (err) {
      console.error("❌ Gagal update:", err.message);
      alert("Gagal update");
    }
  };

  const handleDelete = async () => {
    const confirmDelete = confirm("Yakin ingin menghapus PC ini?");
    if (!confirmDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/pc/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("✅ PC berhasil dihapus.");
      window.location.href = "/computers";
    } catch (err) {
      console.error("❌ Gagal hapus PC:", err.message);
      alert("Gagal menghapus PC.");
    }
  };

  if (!pc) return <div className="p-6">Loading...</div>;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 bg-slate-50 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200/60 px-8 py-5">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-zinc-800">
              Detail PC — {pc.pcId || pc.serialNumber}
            </h2>
            {pc.status === "online" && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active</span>}
            {pc.status === "idle" && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Idle</span>}
            {pc.status === "offline" && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-red-50 text-red-700 border-red-200"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Offline</span>}
          </div>
          <p className="text-sm text-zinc-400 mt-0.5">Last active: {pc.lastActive ? new Date(pc.lastActive).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "Belum pernah aktif"}</p>
        </div>

        <div className="p-8">



          {/* Info PC + PIC */}
          <div className="grid grid-cols-2 gap-4 text-sm text-zinc-800">
            {/* Serial Number & User Login (read-only) */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Serial Number
              </label>
              <div className="text-sm">{pc.serialNumber || "-"}</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                User Login
              </label>
              <div className="text-sm">{pc.userLogin || "-"}</div>
            </div>

            {/* Computer Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Computer Name
              </label>
              <div className="text-sm">{pc.spec?.hostname || "-"}</div>
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Kategori Ruang
              </label>
              <div className="text-sm">{pc.location?.category || "-"}</div>
            </div>

            {/* Lokasi */}
            <div>
              <label className="block text-sm font-medium mb-1">Lokasi</label>
              <div className="text-sm">
                {pc.site
                  ? `${pc.site} - ${pc.location?.room || ""} (${pc.location?.category || ""})`
                  : "-"}
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">Edit via Asset Management</div>
            </div>

            {/* Admin */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Status Admin
              </label>
              <div className="text-sm">
                {pc.isAdmin ? "✅ Admin" : "❌ Bukan Admin"}
              </div>
            </div>



            {/* Brand / Model */}
            <div>
              <label className="block text-sm font-medium mb-1">Brand</label>
              <div className="text-sm">{pc.spec?.brand || "-"}</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Model</label>
              <div className="text-sm">{pc.spec?.model || "-"}</div>
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            {/* Edit and Delete buttons removed to enforce management through AssetDetail */}
          </div>

          {/* Spec */}
          <h3 className="text-lg font-semibold mt-10">🛠️ Spesifikasi</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-zinc-800 mt-2">
            <div>OS: {pc.spec?.os || "-"}</div>
            <div>CPU: {pc.spec?.cpu || "-"}</div>
            <div>IP Address: {pc.spec?.ipAddress || "-"}</div>
            <div>MAC Address: {pc.spec?.macAddress || "-"}</div>
            <div>GPU: {pc.spec?.gpu || "-"}</div>
            <div>RAM: {pc.spec?.ram || "-"}</div>
          </div>

          {pc.spec?.disk?.length > 0 && (
            <div className="mt-2 text-sm text-zinc-700">
              <strong>Disk:</strong>
              <ul className="list-disc ml-6 mt-1">
                {pc.spec.disk.map((d, i) => (
                  <li key={i}>
                    Drive {d.drive}: {d.total} ({d.type})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Performance */}
          <h3 className="text-lg font-semibold mt-10">
            📈 Performance (Terbaru)
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-zinc-800 mt-2">
            <div>CPU Usage: {pc.performance?.cpuUsage ?? "-"}%</div>
            <div>RAM Usage: {pc.performance?.ramUsage ?? "-"}%</div>

            {pc.performance?.diskUsage && pc.performance.diskUsage.length > 0 && (
              <div className="col-span-2">
                <span className="text-gray-500 font-medium">Disk Usage:</span>
                <div className="flex gap-4 mt-1 flex-wrap">
                  {pc.performance.diskUsage.map((disk, idx) => {
                    const percent = disk.total > 0 ? Math.round((disk.used / disk.total) * 100) : 0;
                    return (
                      <div key={idx} className="flex item-center gap-1.5 bg-zinc-100/70 border border-zinc-200 px-3 py-1.5 rounded-lg text-xs">
                        <span className="font-semibold text-zinc-700">Drive {disk.drive}</span>
                        <span className="text-zinc-500">{disk.used} GB / {disk.total} GB</span>
                        <span className={`font-medium ${percent > 85 ? 'text-red-600' : 'text-emerald-600'}`}>({percent}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              Idle Time (raw): {formatDuration(pc.performance?.idleRaw || 0)}
            </div>
            <div>
              Idle Time (after threshold):{" "}
              {formatDuration(pc.performance?.idleTime || 0)}
            </div>

            <div>Total Uptime (semua hari): {formatDuration(uptimeLifetime)}</div>
            <div>Uptime Hari Ini: {formatDuration(uptimeToday)}</div>
            <div>Uptime Sesi Aktif: {formatDuration(uptimeSession)}</div>

            {/* 🔋 Battery */}
            {pc.performance?.battery ? (
              <div className="flex flex-col">
                <span className="text-gray-500 font-medium whitespace-nowrap">Battery Status</span>
                <span className="text-zinc-800">
                  {pc.performance.battery.percent}%
                  ({pc.performance.battery.isCharging ? '🔌 Charging' : '🔋 Discharging'})
                  {pc.performance.battery.health ? ` — Health: ${pc.performance.battery.health}%` : ''}
                </span>
              </div>
            ) : (
              <div className="flex flex-col">
                <span className="text-gray-500 font-medium">Battery Status</span>
                <span className="text-zinc-400 italic">Bukan Laptop / No Data</span>
              </div>
            )}

            {/* 💽 Disk Health */}
            {pc.performance?.diskHealth && pc.performance.diskHealth.length > 0 && (
              <div className="flex flex-col col-span-2 mt-2">
                <span className="text-gray-500 font-medium mb-1">Disk S.M.A.R.T Status</span>
                <div className="flex gap-2 flex-wrap">
                  {pc.performance.diskHealth.map((disk, idx) => (
                    <span key={idx} className={`px-2 py-1 rounded-md text-xs font-semibold border ${disk.smartStatus?.toLowerCase() === 'ok'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                      {disk.name} ({disk.type}): {disk.smartStatus}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Installed Apps */}
          <h3 className="text-lg font-semibold mt-10">
            📦 Aplikasi Terinstall
            {installedApps.length > 0 && (
              <span className="text-sm font-normal text-zinc-400 ml-2">({installedApps.length} apps)</span>
            )}
          </h3>
          {installedApps.length === 0 ? (
            <p className="text-sm text-zinc-500">Belum ada data aplikasi.</p>
          ) : (
            <div className="mt-2">
              <input
                type="text"
                placeholder="Cari aplikasi..."
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                className="w-full max-w-sm px-3 py-1.5 mb-3 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <div className="max-h-[400px] overflow-y-auto border border-zinc-200 rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 sticky top-0">
                    <tr className="text-left text-xs text-zinc-500 uppercase">
                      <th className="px-4 py-2 w-8">#</th>
                      <th className="px-4 py-2">Nama Aplikasi</th>
                      <th className="px-4 py-2">Versi</th>
                      <th className="px-4 py-2">Publisher</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {installedApps
                      .filter((app) => {
                        if (!appSearch) return true;
                        const q = appSearch.toLowerCase();
                        return (
                          (app.DisplayName || "").toLowerCase().includes(q) ||
                          (app.Publisher || "").toLowerCase().includes(q)
                        );
                      })
                      .map((app, i) => (
                        <tr key={i} className="hover:bg-zinc-50">
                          <td className="px-4 py-1.5 text-zinc-400">{i + 1}</td>
                          <td className="px-4 py-1.5 font-medium text-zinc-700">{app.DisplayName}</td>
                          <td className="px-4 py-1.5 text-zinc-500">{app.DisplayVersion || "-"}</td>
                          <td className="px-4 py-1.5 text-zinc-500">{app.Publisher || "-"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Spec History */}
          <h3 className="text-lg font-semibold mt-10">
            🕓 Riwayat Perubahan Spesifikasi
          </h3>
          {specHistory.length === 0 ? (
            <p className="text-sm text-zinc-500">Belum ada riwayat perubahan.</p>
          ) : (
            <div className="space-y-4 mt-2 text-sm text-zinc-800">
              {specHistory.map((item) => (
                <div
                  key={item._id}
                  className={`p-4 rounded border shadow ${item.approved
                    ? "bg-green-50 border-green-300"
                    : item.rejected
                      ? "bg-red-50 border-red-300"
                      : "bg-yellow-50 border-yellow-300"
                    }`}
                >
                  <div className="font-medium mb-1 text-zinc-700">
                    {new Date(item.createdAt).toLocaleString()} —{" "}
                    {item.approved
                      ? "✅ Disetujui"
                      : item.rejected
                        ? "❌ Ditolak"
                        : "⏳ Menunggu Review"}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(item.newSpec)
                      .filter(
                        (key) =>
                          JSON.stringify(item.oldSpec[key]) !==
                          JSON.stringify(item.newSpec[key])
                      )
                      .map((key) => (
                        <div key={key}>
                          <strong>{key}</strong>:{" "}
                          {key === "disk" ? (
                            <ul className="ml-4 list-disc">
                              {(item.newSpec.disk || []).map((d, idx) => {
                                const oldDisk = (item.oldSpec.disk || []).find(
                                  (od) => od.drive === d.drive
                                );
                                return (
                                  <li key={idx}>
                                    <span className="text-red-500 line-through">
                                      {oldDisk
                                        ? `${oldDisk.drive}: ${oldDisk.total} (${oldDisk.type})`
                                        : "-"}
                                    </span>{" "}
                                    →{" "}
                                    <span className="text-green-700 font-medium">
                                      {`${d.drive}: ${d.total} (${d.type})`}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <>
                              <span className="text-red-500 line-through">
                                {item.oldSpec[key] || "-"}
                              </span>{" "}
                              →{" "}
                              <span className="text-green-700 font-medium">
                                {item.newSpec[key]}
                              </span>
                            </>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
