import React, { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/Sidebar"; // ✅ Tambahkan ini

export default function UpdateTimeout() {
  const [pcs, setPcs] = useState([]);
  const [filteredPcs, setFilteredPcs] = useState([]);
  const [selected, setSelected] = useState([]);
  const [timeout, setTimeout] = useState("");

  const [campusList, setCampusList] = useState([]);
  const [roomList, setRoomList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [selectedCampus, setSelectedCampus] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get("/api/pc/list-with-location");
      setPcs(res.data);

      setCampusList([
        ...new Set(res.data.map((pc) => pc.location?.campus).filter(Boolean)),
      ]);
      setRoomList([
        ...new Set(res.data.map((pc) => pc.location?.room).filter(Boolean)),
      ]);
      setCategoryList([
        ...new Set(res.data.map((pc) => pc.location?.category).filter(Boolean)),
      ]);
    };

    fetchData();
  }, []);

  useEffect(() => {
    let result = pcs;

    if (selectedCampus) {
      result = result.filter((pc) => pc.location?.campus === selectedCampus);
    }
    if (selectedRoom) {
      result = result.filter((pc) => pc.location?.room === selectedRoom);
    }
    if (selectedCategory) {
      result = result.filter(
        (pc) => pc.location?.category === selectedCategory
      );
    }

    setFilteredPcs(result);
  }, [pcs, selectedCampus, selectedRoom, selectedCategory]);

  const toggleSelect = (pcId) => {
    setSelected((prev) =>
      prev.includes(pcId) ? prev.filter((id) => id !== pcId) : [...prev, pcId]
    );
  };

  const toggleAll = (checked) => {
    if (checked) {
      setSelected(filteredPcs.map((pc) => pc.pcId));
    } else {
      setSelected([]);
    }
  };

  const handleSubmit = async () => {
    if (!timeout || selected.length === 0) {
      alert("⛔ Pilih PC dan isi timeout terlebih dahulu!");
      return;
    }

    try {
      await axios.patch("/api/pc/timeout", {
        pcIds: selected,
        idleTimeout: parseInt(timeout),
      });
      alert("✅ Timeout berhasil diupdate!");
    } catch (err) {
      console.error(err);
      alert("❌ Gagal update timeout");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 bg-zinc-100 p-6 overflow-y-auto space-y-6">
        <h2 className="text-xl font-bold">Update Idle Timeout Massal</h2>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <select
            className="border px-3 py-2 rounded"
            value={selectedCampus}
            onChange={(e) => setSelectedCampus(e.target.value)}
          >
            <option value="">Filter by Campus</option>
            {campusList.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <select
            className="border px-3 py-2 rounded"
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
          >
            <option value="">Filter by Room</option>
            {roomList.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>

          <select
            className="border px-3 py-2 rounded"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Filter by Category</option>
            {categoryList.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border text-sm bg-white">
            <thead className="bg-gray-100">
              <tr className="text-left">
                <th className="p-2">
                  <input
                    type="checkbox"
                    checked={
                      selected.length === filteredPcs.length &&
                      filteredPcs.length > 0
                    }
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                </th>
                <th className="p-2">PIC</th>
                <th className="p-2">User Login</th>
                <th className="p-2">Serial</th>
                <th className="p-2">Asset</th>
                <th className="p-2">Lokasi</th>
                <th className="p-2">Category</th>
                <th className="p-2">Idle Timeout</th>
              </tr>
            </thead>
            <tbody>
              {filteredPcs.map((pc) => (
                <tr key={pc._id} className="border-t">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(pc.pcId)}
                      onChange={() => toggleSelect(pc.pcId)}
                    />
                  </td>
                  <td className="p-2">{pc.pic || "-"}</td>
                  <td className="p-2">{pc.userLogin || "-"}</td>
                  <td className="p-2">{pc.serialNumber}</td>
                  <td className="p-2">{pc.assetNumber}</td>
                  <td className="p-2">
                    {pc.location?.campus} - {pc.location?.room}
                  </td>
                  <td className="p-2">{pc.location?.category}</td>
                  <td className="p-2">{pc.idleTimeout}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer form */}
        <div className="flex items-center gap-4 mt-4">
          <Input
            type="number"
            placeholder="Timeout (mnt)"
            value={timeout}
            onChange={(e) => setTimeout(e.target.value)}
            className="w-[200px]"
          />
          <Button onClick={handleSubmit}>Update Timeout</Button>
        </div>
      </div>
    </div>
  );
}
