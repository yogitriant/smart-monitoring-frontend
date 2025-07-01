import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "@/lib/axios"; // Ganti import
import Sidebar from "@/components/Sidebar";

export default function OpnameDetail() {
  const { id } = useParams();
  const location = useLocation(); // Jangan lupa ini!
  const [report, setReport] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const isPublic = location.pathname.includes("/public");
        const endpoint = isPublic
          ? `/api/opname/public/${id}`
          : `/api/opname/${id}`;

        const res = await axios.get(endpoint, {
          headers: isPublic ? {} : undefined, // biar gak override interceptor
        });

        setReport(res.data);
      } catch (err) {
        console.error("❌ Gagal ambil detail report:", err.message);
      }
    };
    fetchReport();
  }, [id, location.pathname]);

  if (!report) return <div className="p-6">Loading...</div>;

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 bg-zinc-100 p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          📄 Laporan: {report.reportName}
        </h2>

        <table className="w-full text-sm border bg-white rounded shadow">
          <thead>
            <tr className="bg-zinc-200 text-left">
              <th className="p-2">PIC</th>
              <th className="p-2">PC ID</th>
              <th className="p-2">Serial</th>
              <th className="p-2">Asset</th>
              <th className="p-2">Lokasi</th>
              <th className="p-2">RAM</th>
              <th className="p-2">Storage</th>
              <th className="p-2">Status</th>
              <th className="p-2">Kondisi</th>
              <th className="p-2">Keterangan</th>
              <th className="p-2">Teknisi</th>
            </tr>
          </thead>
          <tbody>
            {report.items.map((item) => (
              <tr key={item.pcId} className="border-t">
                <td className="p-2">{item.pic || "-"}</td>
                <td className="p-2">{item.pcId}</td>
                <td className="p-2">{item.serialNumber}</td>
                <td className="p-2">{item.assetNumber}</td>
                <td className="p-2">{item.location}</td>
                <td className="p-2">{item.ram || "-"}</td>
                <td className="p-2">{item.storage || "-"}</td>
                <td className="p-2">{item.status || "-"}</td>
                <td className="p-2">
                  {item.kondisi && item.kondisi !== "-" ? item.kondisi : "-"}
                </td>
                <td className="p-2">
                  {item.keterangan && item.keterangan !== "-"
                    ? item.keterangan
                    : "-"}
                </td>
                <td className="p-2 text-zinc-600">{item.updatedBy || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
