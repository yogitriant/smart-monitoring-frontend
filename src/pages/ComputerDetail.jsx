import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "@/lib/axios";
import Sidebar from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { io } from "socket.io-client";
import dayjs from "dayjs";

let socket;

export default function ComputerDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [pc, setPc] = useState(null);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [specHistory, setSpecHistory] = useState([]);
  const [installedApps, setInstalledApps] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    email: "",
    assetNumber: "",
    pic: "",
    location: "",
    category: "",
    isAdmin: false,
    lifecycleStatus: "",
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

    // Join room berdasarkan pcId
    socket.on("connect", () => {
      console.log("🧾 Join-room dengan pcId:", id);
      // socket.emit("join-room", id);
    });

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const role = user.role || "";

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        // Ambil data utama paralel
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

        setPc(pcRes.data);
        setLocations(locRes.data);
        setCategories(catRes.data);
        setForm({
          email: pcRes.data.email || "",
          assetNumber: pcRes.data.assetNumber || "",
          pic: pcRes.data.pic || "",
          location: pcRes.data.location?._id || "",
          category: pcRes.data.location?.category || "",
          isAdmin: pcRes.data.isAdmin || false,
          lifecycleStatus: pcRes.data.lifecycleStatus || "",
        });

        // Ambil uptime
        const today = dayjs().format("YYYY-MM-DD");
        const [uptimeTodayRes, uptimeLifetimeRes] = await Promise.all([
          axios.get(
            `${
              import.meta.env.VITE_API_BASE_URL
            }/api/uptime?pc=${id}&date=${today}`,
            { headers }
          ),
          axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/api/uptime/total/${id}`,
            { headers }
          ),
        ]);
        setUptimeToday(Number(uptimeTodayRes.data?.uptimeTotalToday || 0));
        setUptimeSession(Number(uptimeTodayRes.data?.uptimeSession || 0));
        setUptimeLifetime(Number(uptimeLifetimeRes.data?.uptimeLifetime || 0));

        // Jika admin
        if (role === "admin" || role === "superadmin") {
          const historyRes = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/api/spec-history`,
            { headers }
          );
          setSpecHistory(historyRes.data.filter((item) => item.pc?._id === id));
        }
      } catch (err) {
        console.error("❌ Gagal fetch detail:", err.message);
      }
    };

    fetchData();
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
      const res = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/pc/${id}`,
        form
      );
      alert("✅ Data berhasil diperbarui!");
      setEditMode(false);

      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const pcDetailRes = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/pc/${id}`,
        { headers }
      );
      setPc(pcDetailRes.data);
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
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 bg-zinc-100 p-6 overflow-y-auto">
        {/* Header: Title + Status */}
        <div className="flex items-center  mb-1">
          <h2 className="text-2xl font-bold">
            🖥️ Detail PC - {pc.pcId || pc.serialNumber}
          </h2>
          {pc.status === "online" && (
            <span className="text-green-600 text-sm font-medium bg-green-100 px-2 py-1 rounded">
              🟢 Aktif
            </span>
          )}
          {pc.status === "idle" && (
            <span className="text-yellow-600 text-sm font-medium bg-yellow-100 px-2 py-1 rounded">
              🟡 Idle
            </span>
          )}
          {pc.status === "offline" && (
            <span className="text-red-600 text-sm font-medium bg-red-100 px-2 py-1 rounded">
              🔴 Offline
            </span>
          )}
        </div>

        {/* Last Active */}
        <p className="text-sm text-zinc-500 mb-4">
          Last active:{" "}
          {pc.lastActive
            ? new Date(pc.lastActive).toLocaleString("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "Belum pernah aktif"}
        </p>

        {/* 🧾 Info PC */}
        <div className="grid grid-cols-2 gap-4 text-sm text-zinc-800">
          {/* PIC */}
          <div>
            <label className="block text-sm font-medium mb-1">PIC</label>
            {editMode ? (
              <Input name="pic" value={form.pic} onChange={handleChange} />
            ) : (
              <div className="text-sm">{form.pic || "-"}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            {editMode ? (
              <Input
                name="email"
                value={form.email}
                onChange={handleChange}
                type="email"
              />
            ) : (
              <div className="text-sm">{form.email || "-"}</div>
            )}
          </div>

          {/* Serial Number */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Serial Number
            </label>
            <div className="text-sm">{pc.serialNumber || "-"}</div>
          </div>

          {/* Asset Number */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Asset Number
            </label>
            {editMode ? (
              <Input
                name="assetNumber"
                value={form.assetNumber}
                onChange={handleChange}
              />
            ) : (
              <div className="text-sm">{form.assetNumber || "-"}</div>
            )}
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Kategori Ruang
            </label>
            {editMode ? (
              <select
                name="category"
                value={form.category}
                onChange={handleCategoryChange}
                className="w-full border rounded px-2 py-1"
              >
                <option value="">-- Pilih Kategori --</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm">{pc.location?.category || "-"}</div>
            )}
          </div>

          {/* Lokasi */}
          <div>
            <label className="block text-sm font-medium mb-1">Lokasi</label>
            {editMode ? (
              <select
                name="location"
                value={form.location}
                onChange={handleChange}
                className="w-full border rounded px-2 py-1"
              >
                <option value="">-- Pilih Lokasi --</option>
                {locations.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.campus} - {loc.room} ({loc.category})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm">
                {pc.location
                  ? `${pc.location.campus} - ${pc.location.room} (${pc.location.category})`
                  : "-"}
              </div>
            )}
          </div>

          {/* Status Admin */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Status Admin
            </label>
            {editMode ? (
              <select
                name="isAdmin"
                value={form.isAdmin ? "true" : "false"}
                onChange={(e) =>
                  setForm({ ...form, isAdmin: e.target.value === "true" })
                }
                className="w-full border rounded px-2 py-1"
              >
                <option value="false">Bukan Admin</option>
                <option value="true">Admin</option>
              </select>
            ) : (
              <div className="text-sm">
                {pc.isAdmin ? "✅ Admin" : "❌ Bukan Admin"}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-zinc-800">
            <div>
              <label className="block text-sm font-medium mb-1">
                Lifecycle Status
              </label>
              {editMode ? (
                <select
                  name="lifecycleStatus"
                  value={form.lifecycleStatus}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="">-- Pilih Status --</option>
                  <option value="in_use">In Use</option>
                  <option value="in_store">In Store</option>
                  <option value="under_repair">Under Repair</option>
                  <option value="disposal">Disposal</option>
                </select>
              ) : (
                <div className="text-sm capitalize">
                  {form.lifecycleStatus.replace("_", " ") || "-"}
                </div>
              )}
            </div>
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium mb-1">Brand</label>
            <div className="text-sm">{pc.spec?.brand || "-"}</div>
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium mb-1">Model</label>
            <div className="text-sm">{pc.spec?.model || "-"}</div>
          </div>
        </div>

        <div className="flex gap-2 mt-2">
          {editMode ? (
            <>
              <Button onClick={handleSave}>💾 Simpan</Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setEditMode(false);
                  // 🔁 Reset form ke nilai asli dari pc
                  setForm({
                    email: pc.email || "",
                    assetNumber: pc.assetNumber || "",
                    pic: pc.pic || "",
                    location: pc.location?._id || "",
                    category: pc.location?.category || "",
                    isAdmin: pc.isAdmin || false,
                    lifecycleStatus: pc.lifecycleStatus || "", // tambahkan jika pakai ini
                  });
                }}
              >
                Batal
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setEditMode(true)}>✏️ Edit</Button>
              {(user?.role === "admin" || user?.role === "superadmin") && (
                <Button
                  variant="destructive"
                  className="ml-2"
                  onClick={handleDelete}
                >
                  🗑️ Hapus
                </Button>
              )}
            </>
          )}
        </div>

        {/* 💡 Kontrol Power */}
        {/* <h3 className="text-lg font-semibold mt-10">🔌 Power Control</h3>
        <div className="flex gap-3 mt-2">
          <Button
            variant="destructive"
            onClick={async () => {
              try {
                await axios.post(
                  `${import.meta.env.VITE_API_BASE_URL}/api/power/shutdown`,
                  {
                    pcId: pc._id,
                  }
                );
                alert("🔌 Shutdown command sent");
              } catch (err) {
                alert("❌ Gagal kirim perintah shutdown");
              }
            }}
          >
            🛑 Shutdown
          </Button>
          <Button
            variant="default"
            onClick={async () => {
              try {
                await axios.post(
                  `${import.meta.env.VITE_API_BASE_URL}/api/power/restart`,
                  {
                    pcId: pc._id,
                  }
                );
                alert("🔁 Restart command sent");
              } catch (err) {
                alert("❌ Gagal kirim perintah restart");
              }
            }}
          >
            🔁 Restart
          </Button>
          <Button
            onClick={async () => {
              try {
                await axios.post(
                  `${import.meta.env.VITE_API_BASE_URL}/api/power/wakeup`,
                  {
                    macAddress: pc.spec?.macAddress,
                  }
                );
                alert("💡 Wake-up command sent");
              } catch (err) {
                alert("❌ Gagal kirim perintah wake-up");
              }
            }}
          >
            🌙 Wake Up
          </Button>
        </div> */}

        {/* 🛠️ Spec */}
        <h3 className="text-lg font-semibold mt-10">🛠️ Spesifikasi</h3>
        <div className="grid grid-cols-2 gap-4 text-sm text-zinc-800 mt-2">
          <div>OS: {pc.spec?.os || "-"}</div>
          <div>CPU: {pc.spec?.cpu || "-"}</div>
          <div>IP Address: {pc.spec?.ipAddress || "-"}</div>
          <div>MAC Address: {pc.spec?.macAddress || "-"}</div>
          <div>GPU: {pc.spec?.gpu || "-"}</div>
          {/* <div>Resolution: {pc.spec?.resolution || "-"}</div> */}
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

        {/* 📈 Performance */}
        <h3 className="text-lg font-semibold mt-10">
          📈 Performance (Terbaru)
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm text-zinc-800 mt-2">
          <div>CPU Usage: {pc.performance?.cpuUsage ?? "-"}%</div>
          <div>RAM Usage: {pc.performance?.ramUsage ?? "-"}%</div>
          <div>Idle Time: {formatDuration(pc.performance?.idleTime || 0)}</div>
          <div>Total Uptime (semua hari): {formatDuration(uptimeLifetime)}</div>
          <div>Uptime Hari Ini: {formatDuration(uptimeToday)}</div>
          <div>Uptime Sesi Aktif: {formatDuration(uptimeSession)}</div>
        </div>

        {pc.performance?.diskUsage?.length > 0 && (
          <div className="mt-2 text-sm text-zinc-700">
            <strong>Disk Usage:</strong>
            <ul className="list-disc ml-6 mt-1">
              {pc.performance.diskUsage.map((d, i) => {
                const percentage =
                  d.total > 0 ? ((d.used / d.total) * 100).toFixed(2) : "-";

                const percentNum = parseFloat(percentage);
                let colorClass = "text-green-600"; // default aman

                if (percentNum > 85) colorClass = "text-red-600";
                else if (percentNum > 60) colorClass = "text-yellow-600";

                return (
                  <li key={i}>
                    Drive {d.drive} {d.used} / {d.total} GB{" "}
                    <span className={colorClass}>({percentage}%)</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* 🕓 Spec History */}
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
                className={`p-4 rounded border shadow ${
                  item.approved
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
  );
}
