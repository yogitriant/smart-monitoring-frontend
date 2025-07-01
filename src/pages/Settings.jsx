import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";

export default function Settings() {
  const { user, logout } = useAuth();
  const [defaultTimeout, setDefaultTimeout] = useState(60);
  const [uptimeInterval, setUptimeInterval] = useState(5); // default 5 menit
  const [categoryTimeouts, setCategoryTimeouts] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [newTimeout, setNewTimeout] = useState("");
  const [availableCategories, setAvailableCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const settingRes = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/settings`
        );
        if (settingRes.data) {
          setDefaultTimeout(settingRes.data.defaultTimeout || 0);
          setCategoryTimeouts(settingRes.data.categoryTimeouts || []);
          setUptimeInterval((settingRes.data.uptimeInterval || 300) / 60);
        }

        const catRes = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/location/categories`
        );
        console.log(catRes.data);
        setAvailableCategories(catRes.data);
      } catch (err) {
        console.error("❌ Gagal fetch data:", err);
      }
    };

    fetchData();
  }, []);

  const handleAddCategory = () => {
    if (!newCategory || !newTimeout) return;
    if (categoryTimeouts.some((ct) => ct.category === newCategory)) return;

    setCategoryTimeouts([
      ...categoryTimeouts,
      { category: newCategory, timeout: parseInt(newTimeout) },
    ]);
    setNewCategory("");
    setNewTimeout("");
  };

  const handleDeleteCategory = (idx) => {
    const updated = [...categoryTimeouts];
    updated.splice(idx, 1);
    setCategoryTimeouts(updated);
  };

  const handleSave = async () => {
    try {
      const payload = {
        defaultTimeout: parseInt(defaultTimeout),
        categoryTimeouts: categoryTimeouts
          .map((item) => ({
            category: item.category,
            timeout: parseInt(item.timeout),
          }))
          .filter((item) => !isNaN(item.timeout)), // Hapus yang timeout-nya bukan angka
      };

      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/settings`,
        payload
      );

      alert("✅ Pengaturan berhasil disimpan");
    } catch (err) {
      console.error("❌ Gagal simpan settings:", err);
      alert("❌ Gagal menyimpan pengaturan");
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 bg-zinc-100 p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">⚙️ Settings</h2>

        {/* Info user */}
        <div className="bg-white p-4 rounded shadow space-y-4 mb-6">
          <div>
            <p className="text-sm text-zinc-500">Username</p>
            <p className="font-medium">{user?.username}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Role</p>
            <p className="font-medium capitalize">{user?.role}</p>
          </div>
        </div>

        {/* Timeout settings */}
        <div className="bg-white p-4 rounded shadow space-y-4 mb-6">
          <h3 className="text-lg font-semibold">🕒 Idle Timeout</h3>

          <label className="block text-sm mb-1">Default Timeout (menit)</label>
          <Input
            type="number"
            min={1}
            value={defaultTimeout}
            onChange={(e) => setDefaultTimeout(e.target.value)}
          />

          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-semibold">Kategori Lokasi</h4>

            {categoryTimeouts.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center border p-2 rounded"
              >
                <div>
                  <span className="font-medium">{item.category}</span>{" "}
                  <span className="text-sm text-gray-500">
                    ({item.timeout} menit)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteCategory(idx)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}

            {/* Tambah kategori */}
            <div className="flex gap-2 mt-3">
              <select
                className="border px-3 py-2 rounded w-48"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                <option value="">Pilih kategori</option>
                {availableCategories.map((cat, idx) => (
                  <option key={idx} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <Input
                placeholder="Timeout (mnt)"
                type="number"
                min={1}
                value={newTimeout}
                onChange={(e) => setNewTimeout(e.target.value)}
              />
              <Button onClick={handleAddCategory}>Tambah</Button>
            </div>
          </div>
        </div>
        {/* <div className="bg-white p-4 rounded shadow space-y-4 mb-6">
          <h3 className="text-lg font-semibold">⏱️ Uptime Interval</h3>

          <label className="block text-sm mb-1">
            Interval Kirim Uptime (menit)
          </label>
          <Input
            type="number"
            min={1}
            value={uptimeInterval}
            onChange={(e) => setUptimeInterval(e.target.value)}
          />
        </div> */}

        <div className="flex justify-between">
          <Button onClick={handleSave}>💾 Simpan</Button>
          {/* <Button variant="destructive" onClick={logout}>⏻ Logout</Button> */}
        </div>
      </div>
    </div>
  );
}
