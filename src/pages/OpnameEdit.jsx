import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import Sidebar from "@/components/Sidebar";

export default function OpnameEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [reportName, setReportName] = useState("");
  const [pcList, setPcList] = useState([]);
  const [selectedPcIds, setSelectedPcIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportRes, pcsRes] = await Promise.all([
          api.get(`/api/opname/${id}`),
          api.get("/api/pc/list"),
        ]);

        const report = reportRes.data;
        setReportName(report.reportName);
        setSelectedPcIds(report.items.map((item) => item._id));
        setPcList(pcsRes.data);
      } catch (err) {
        console.error("❌ Gagal ambil data untuk edit:", err.message);
        alert("Gagal memuat data laporan.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/api/opname/${id}`, {
        reportName,
        pcIds: selectedPcIds,
      });
      alert("✅ Laporan berhasil diperbarui.");
      navigate("/opname");
    } catch (err) {
      console.error("❌ Gagal update laporan:", err.message);
      alert("Gagal menyimpan perubahan.");
    }
  };

  const togglePcSelection = (pcId) => {
    setSelectedPcIds((prev) =>
      prev.includes(pcId) ? prev.filter((id) => id !== pcId) : [...prev, pcId]
    );
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 bg-zinc-100 p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">✏️ Edit Laporan Opname</h2>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-1 font-medium">Nama Laporan</label>
              <input
                type="text"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">Pilih PC</label>
              <div className="overflow-auto max-h-[500px] border rounded bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-100 text-left">
                    <tr>
                      <th className="p-2">Pilih</th>
                      <th className="p-2">PC ID</th>
                      <th className="p-2">Serial</th>
                      <th className="p-2">Asset</th>
                      <th className="p-2">Lokasi</th>
                      <th className="p-2">PIC</th>
                      <th className="p-2">RAM</th>
                      <th className="p-2">Storage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pcList.map((pc) => (
                      <tr key={pc._id} className="border-t">
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedPcIds.includes(pc._id)}
                            onChange={() => togglePcSelection(pc._id)}
                          />
                        </td>
                        <td className="p-2">{pc.pcId}</td>
                        <td className="p-2">{pc.serialNumber}</td>
                        <td className="p-2">{pc.assetNumber}</td>
                        <td className="p-2">
                          {pc.location?.campus || "-"} -{" "}
                          {pc.location?.room || "-"}
                        </td>
                        <td className="p-2">{pc.pic || "-"}</td>
                        <td className="p-2">{pc.spec?.ram || "-"}</td>
                        <td className="p-2">
                          {Array.isArray(pc.spec?.disk)
                            ? pc.spec.disk
                                .map((d) => `${d.total} ${d.type}`)
                                .join(", ")
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Simpan Perubahan
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
