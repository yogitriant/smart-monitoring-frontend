import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";

export default function SpecHistory() {
  const [history, setHistory] = useState([]);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const fetchHistory = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/spec-history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setHistory(res.data);
    } catch (err) {
      console.error(
        "❌ Gagal ambil riwayat:",
        err.response?.data || err.message
      );
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/spec-history/${id}/approve`,
        { adminName: user.username },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchHistory();
    } catch (err) {
      alert("❌ Gagal approve");
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/spec-history/${id}/reject`,
        { adminName: user.username },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchHistory();
    } catch (err) {
      alert("❌ Gagal reject");
    }
  };

  const getDiskTotal = (diskArray, type) => {
    if (!Array.isArray(diskArray)) return 0;
    return diskArray
      .filter((d) => d.type === type)
      .reduce((sum, d) => sum + parseFloat(d.total), 0);
  };

  const formatDisk = (disk) => {
    const ssd = getDiskTotal(disk, "SSD");
    const hdd = getDiskTotal(disk, "HDD");
    const format = (val) =>
      val >= 1000 ? `${(val / 1000).toFixed(1)} TB` : `${val} GB`;

    return [
      ssd ? `SSD: ${format(ssd)}` : null,
      hdd ? `HDD: ${format(hdd)}` : null,
    ]
      .filter(Boolean)
      .join(" + ");
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 p-6 overflow-y-auto bg-zinc-100">
        <h2 className="text-2xl font-bold mb-4">
          📋 Riwayat Perubahan Spesifikasi
        </h2>

        {history.length === 0 ? (
          <p className="text-sm text-zinc-500">Belum ada data riwayat.</p>
        ) : (
          <div className="space-y-6">
            {history.map((item) => {
              const statusColor = item.approved
                ? "bg-green-50 border-green-300"
                : item.rejected
                ? "bg-red-50 border-red-300"
                : "bg-yellow-50 border-yellow-300";

              return (
                <div
                  key={item._id}
                  className={`p-4 rounded shadow text-sm border ${statusColor}`}
                >
                  <div className="font-medium text-zinc-700 mb-1">
                    PC: {item.pc?.pcId || item.pc?.serialNumber || "-"} <br />
                    🕓 {new Date(item.createdAt).toLocaleString()}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-zinc-600 mt-2">
                    {Object.keys(item.newSpec)
                      .filter(
                        (key) =>
                          JSON.stringify(item.oldSpec[key]) !==
                          JSON.stringify(item.newSpec[key])
                      )
                      .map((key) => (
                        <div
                          key={key}
                          className="bg-white border px-2 py-1 rounded shadow-sm"
                        >
                          <strong className="text-zinc-800">{key}</strong>:{" "}
                          {key === "disk" ? (
                            <>
                              <span className="line-through text-red-500">
                                {formatDisk(item.oldSpec.disk)}
                              </span>{" "}
                              →{" "}
                              <span className="text-green-700 font-medium">
                                {formatDisk(item.newSpec.disk)}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="line-through text-red-500">
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

                  <div className="mt-4 flex gap-2">
                    {item.approved ? (
                      <span className="text-green-600 font-medium">
                        ✅ Disetujui oleh {item.approvedBy}
                      </span>
                    ) : item.rejected ? (
                      <span className="text-red-600 font-medium">
                        ❌ Ditolak oleh {item.approvedBy}
                      </span>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(item._id)}
                        >
                          ✅ Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(item._id)}
                        >
                          ❌ Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
