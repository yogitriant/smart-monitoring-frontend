// pages/OpnameCreate.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import api from "@/lib/axios";

export default function OpnameCreate() {
  const navigate = useNavigate();

  const [reportName, setReportName] = useState("");
  const [pcList, setPcList] = useState([]);
  const [selectedPcIds, setSelectedPcIds] = useState([]);
  const [campusFilter, setCampusFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");

  useEffect(() => {
    const fetchPCs = async () => {
      try {
        const res = await api.get("/api/pc/list");
        setPcList(res.data);
      } catch (err) {
        console.error("❌ Gagal ambil data PC:", err.message);
        alert("Gagal memuat daftar PC.");
      }
    };
    fetchPCs();
  }, []);

  const togglePcSelection = (pcId) => {
    setSelectedPcIds((prev) =>
      prev.includes(pcId) ? prev.filter((id) => id !== pcId) : [...prev, pcId]
    );
  };

  const filteredPcList = pcList.filter((pc) => {
    const matchCampus = campusFilter
      ? pc.location?.campus === campusFilter
      : true;
    const matchRoom = roomFilter ? pc.location?.room === roomFilter : true;
    return matchCampus && matchRoom;
  });

  const campusList = [
    ...new Set(pcList.map((pc) => pc.location?.campus).filter(Boolean)),
  ];
  const roomList = [
    ...new Set(
      pcList
        .filter((pc) => !campusFilter || pc.location?.campus === campusFilter)
        .map((pc) => pc.location?.room)
        .filter(Boolean)
    ),
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/opname", {
        reportName,
        pcIds: selectedPcIds,
      });
      alert("✅ Laporan berhasil dibuat.");
      navigate("/opname");
    } catch (err) {
      console.error("❌ Gagal buat laporan:", err.message);
      alert("Gagal membuat laporan.");
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 bg-zinc-100 p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">📄 Buat Opname Report</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            placeholder="Nama Laporan"
            className="p-2 border rounded w-full max-w-md"
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            required
          />

          <div className="flex gap-4 mb-2">
            <select
              value={campusFilter}
              onChange={(e) => {
                setCampusFilter(e.target.value);
                setRoomFilter("");
              }}
              className="border p-2 rounded text-sm"
            >
              <option value="">Filter by Campus</option>
              {campusList.map((campus) => (
                <option key={campus} value={campus}>
                  {campus}
                </option>
              ))}
            </select>

            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="border p-2 rounded text-sm"
              disabled={!campusFilter}
            >
              <option value="">Filter by Room</option>
              {roomList.map((room) => (
                <option key={room} value={room}>
                  {room}
                </option>
              ))}
            </select>
          </div>

          <table className="w-full text-sm border bg-white rounded shadow">
            <thead>
              <tr className="bg-zinc-200 text-left">
                <th className="p-2">
                  <input
                    type="checkbox"
                    checked={
                      filteredPcList.length > 0 &&
                      filteredPcList.every((pc) =>
                        selectedPcIds.includes(pc._id)
                      )
                    }
                    onChange={(e) => {
                      const filteredIds = filteredPcList.map((pc) => pc._id);
                      if (e.target.checked) {
                        setSelectedPcIds((prev) =>
                          Array.from(new Set([...prev, ...filteredIds]))
                        );
                      } else {
                        setSelectedPcIds((prev) =>
                          prev.filter((id) => !filteredIds.includes(id))
                        );
                      }
                    }}
                  />
                </th>
                <th className="p-2">PC ID</th>
                <th className="p-2">Serial</th>
                <th className="p-2">Asset</th>
                <th className="p-2">Lokasi</th>
              </tr>
            </thead>
            <tbody>
              {filteredPcList.map((pc) => (
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
                    {pc.location?.campus} - {pc.location?.room}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            ➕ Buat Report
          </button>
        </form>
      </div>
    </div>
  );
}
