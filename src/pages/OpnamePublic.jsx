import React, { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import axios from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import io from "socket.io-client";
import { useLocation } from "react-router-dom";

let socket;

export default function OpnamePublic() {
  const { token } = useParams();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [localItems, setLocalItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [lastSavedItems, setLastSavedItems] = useState({});
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;

  useEffect(() => {
    let isMounted = true;

    const fetchReport = async () => {
      if (!token || !user) return;

      try {
        const res = await axios.get(`/api/opname/public/${token}`);
        if (isMounted) {
          setReport(res.data);
          setLocalItems(res.data.items);
          // Inisialisasi lastSavedItems agar row dianggap sudah tersimpan saat pertama kali dibuka
          const saved = {};
          res.data.items.forEach((item) => {
            saved[item.pcObjectId] = {
              status: item.status,
              kondisi: item.kondisi,
              keterangan: item.keterangan,
            };
          });
          setLastSavedItems(saved);
        }

        socket = io(import.meta.env.VITE_API_BASE_URL, {
          transports: ["websocket"],
        });

        socket.on("connect", () => {
          socket.emit("join-room", token);
        });

        socket.on("report-updated", (updatedItem) => {
          if (!isMounted) return;
          setLocalItems((prev) =>
            prev.map((item) =>
              item.pcId === updatedItem.pcId
                ? { ...item, ...updatedItem }
                : item
            )
          );
        });
      } catch (err) {
        console.error("❌ Gagal ambil laporan:", err.message);
        if (isMounted) setError("Gagal mengambil data laporan.");
      }
    };

    fetchReport();

    return () => {
      isMounted = false;
      if (socket) socket.disconnect();
    };
  }, [token, user]);

  const handleLocalChange = (index, field, value) => {
    setLocalItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSave = async (item) => {
    try {
      setSaving(true);
      const payload = {
        updatedBy: user.username,
        status: item.status,
        kondisi: item.kondisi,
        keterangan: item.keterangan,
      };

      await axios.put(
        `/api/opname/${report._id}/items/${item.pcObjectId}`,
        payload
      );

      setReport((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.pcObjectId === item.pcObjectId ? { ...i, ...payload } : i
        ),
      }));

      socket.emit("update-opname", {
        token,
        item: { pcObjectId: item.pcObjectId, ...payload },
      });

      // ✅ Tandai bahwa item ini tersimpan
      setLastSavedItems((prev) => ({
        ...prev,
        [item.pcObjectId]: {
          status: item.status,
          kondisi: item.kondisi,
          keterangan: item.keterangan,
        },
      }));
    } catch (err) {
      console.error("❌ Gagal simpan:", err.message);
    } finally {
      setSaving(false);
    }
  };

  // ✅ Fungsi untuk cek apakah data lokal sama dengan data terakhir disimpan
  const isRowSaved = (item) => {
    const saved = lastSavedItems[item.pcObjectId];
    return (
      saved &&
      saved.status === item.status &&
      saved.kondisi === item.kondisi &&
      saved.keterangan === item.keterangan
    );
  };

  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!report) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">
        📝 Laporan Opname: {report.reportName}
      </h2>
      <p className="text-sm text-zinc-500 mb-4">
        Teknisi: <strong>{user.username}</strong>
      </p>

      <table className="w-full text-sm border bg-white rounded shadow">
        <thead>
          <tr className="bg-zinc-200 text-left">
            <th className="p-2">PC ID</th>
            <th className="p-2">Serial</th>
            <th className="p-2">Asset</th>
            <th className="p-2">Lokasi</th>
            <th className="p-2">Status</th>
            <th className="p-2">Kondisi</th>
            <th className="p-2">Keterangan</th>
            <th className="p-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {localItems.map((item, index) => (
            <tr key={item.pcId} className="border-t">
              <td className="p-2">{item.pcId}</td>
              <td className="p-2">{item.serialNumber}</td>
              <td className="p-2">{item.assetNumber}</td>
              <td className="p-2">{item.location}</td>
              <td className="p-2">
                <select
                  value={item.status || ""}
                  onChange={(e) =>
                    handleLocalChange(index, "status", e.target.value)
                  }
                  className="border rounded px-2 py-1"
                >
                  <option value="">Pilih</option>
                  <option value="hadir">Hadir</option>
                  <option value="tidak hadir">Tidak Hadir</option>
                  <option value="rusak">Rusak</option>
                </select>
              </td>
              <td className="p-2">
                <input
                  placeholder="Kondisi"
                  value={item.kondisi || ""}
                  onChange={(e) =>
                    handleLocalChange(index, "kondisi", e.target.value)
                  }
                  className="border rounded px-2 py-1 w-full"
                />
              </td>
              <td className="p-2">
                <input
                  placeholder="Keterangan"
                  value={item.keterangan || ""}
                  onChange={(e) =>
                    handleLocalChange(index, "keterangan", e.target.value)
                  }
                  className="border rounded px-2 py-1 w-full"
                />
              </td>
              <td className="p-2 flex items-center gap-2">
                <button
                  onClick={() => handleSave(item)}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  Simpan
                </button>
                {isRowSaved(item) && (
                  <span className="text-green-600 text-sm">✔ Tersimpan</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {saving && <p className="text-xs text-zinc-400 mt-2">Menyimpan...</p>}
    </div>
  );
}
