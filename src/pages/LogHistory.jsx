import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";

export default function LogHistory() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    action: "",
    adminName: "",
    startDate: "",
    endDate: "",
    serialNumber: "",
    assetNumber: "",
  });

  useEffect(() => {
    const fetchLogs = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/logs`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLogs(res.data);
      } catch (err) {
        console.error("❌ Gagal fetch logs:", err.message);
      }
    };

    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const { action, adminName, startDate, endDate, serialNumber, assetNumber } =
      filters;

    const timestamp = new Date(log.timestamp || log.createdAt);

    return (
      (!action || log.action === action) &&
      (!adminName ||
        log.adminName?.toLowerCase().includes(adminName.toLowerCase())) &&
      (!serialNumber || log.oldData?.serialNumber?.includes(serialNumber)) &&
      (!assetNumber || log.oldData?.assetNumber?.includes(assetNumber)) &&
      (!startDate || timestamp >= new Date(startDate)) &&
      (!endDate || timestamp <= new Date(endDate))
    );
  });

  const edits = filteredLogs.filter((log) => log.action === "edit");
  const deletes = filteredLogs.filter((log) => log.action === "delete");

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 bg-zinc-100 p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">🕓 Riwayat Edit & Delete PC</h2>

        {/* ======== FILTER ======== */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 text-sm">
          <select
            value={filters.action}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, action: e.target.value }))
            }
            className="px-2 py-1 rounded border"
          >
            <option value="">Semua Aksi</option>
            <option value="edit">✏️ Edit</option>
            <option value="delete">🗑️ Delete</option>
          </select>

          <input
            type="text"
            placeholder="Nama Admin"
            className="px-2 py-1 rounded border"
            value={filters.adminName}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, adminName: e.target.value }))
            }
          />

          <input
            type="text"
            placeholder="Serial Number"
            className="px-2 py-1 rounded border"
            value={filters.serialNumber}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, serialNumber: e.target.value }))
            }
          />

          <input
            type="text"
            placeholder="Asset Number"
            className="px-2 py-1 rounded border"
            value={filters.assetNumber}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, assetNumber: e.target.value }))
            }
          />

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, startDate: e.target.value }))
            }
            className="px-2 py-1 rounded border"
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, endDate: e.target.value }))
            }
            className="px-2 py-1 rounded border"
          />
        </div>

        {/* ======== EDIT LOGS ======== */}
        <div className="mb-10">
          <h3 className="text-lg font-semibold mb-3">✏️ Edit Logs</h3>
          {edits.length === 0 ? (
            <p className="text-sm text-zinc-500">Belum ada log edit.</p>
          ) : (
            <div className="space-y-4">
              {edits.map((log) => {
                const changedFields = Object.keys(log.oldData || {}).filter(
                  (key) =>
                    key !== "updatedAt" &&
                    JSON.stringify(log.oldData[key]) !==
                      JSON.stringify(log.newData?.[key])
                );

                return (
                  <div
                    key={log._id}
                    className="bg-white border rounded shadow p-4 text-sm"
                  >
                    <div className="text-zinc-700 font-medium mb-2">
                      🕓{" "}
                      <span className="text-green-600">
                        {new Date(
                          log.timestamp || log.updatedAt
                        ).toLocaleString()}
                      </span>{" "}
                      — <span className="text-blue-600">{log.adminName}</span>{" "}
                      edit <strong>{log.pcId}</strong>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-3 rounded border text-sm">
                      {changedFields.map((key) => (
                        <div key={key}>
                          <strong className="capitalize">{key}</strong>:{" "}
                          <span className="text-red-500 line-through">
                            {String(log.oldData[key])}
                          </span>{" "}
                          →{" "}
                          <span className="text-green-700 font-semibold">
                            {String(log.newData?.[key])}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ======== DELETE LOGS ======== */}
        <div>
          <h3 className="text-lg font-semibold mb-3">🗑️ Delete Logs</h3>
          {deletes.length === 0 ? (
            <p className="text-sm text-zinc-500">Belum ada log hapus.</p>
          ) : (
            <div className="space-y-4">
              {deletes.map((log) => (
                <div
                  key={log._id}
                  className="bg-white border rounded shadow p-4 text-sm"
                >
                  <div className="text-zinc-700 font-medium mb-2">
                    🕓{" "}
                    <span className="text-green-600">
                      {new Date(
                        log.timestamp || log.createdAt
                      ).toLocaleString()}
                    </span>{" "}
                    — <span className="text-blue-600">{log.adminName}</span>{" "}
                    hapus <strong>{log.pcId}</strong>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-3 rounded border text-sm">
                    <div>
                      <strong>Serial Number</strong>:{" "}
                      {log.oldData?.serialNumber || "-"}
                    </div>
                    <div>
                      <strong>Asset Number</strong>:{" "}
                      {log.oldData?.assetNumber || "-"}
                    </div>
                    <div>
                      <strong>Lokasi</strong>: {log.oldData?.location || "-"}
                    </div>
                    <div>
                      <strong>Admin</strong>:{" "}
                      {log.oldData?.isAdmin ? "✅" : "❌"}
                    </div>
                    <div>
                      <strong>Email</strong>: {log.oldData?.email || "-"}
                    </div>
                    <div>
                      <strong>PIC</strong>: {log.oldData?.pic || "-"}
                    </div>
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
