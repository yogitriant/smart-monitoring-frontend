import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import axios from "@/lib/axios";

export default function Dashboard() {
  const [pcList, setPcList] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    idle: 0,
    offline: 0,
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [campusFilter, setCampusFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const { user } = useAuth();

  const fetchData = async () => {
    try {
      const res = await axios.get("/api/pc/list");
      const data = res.data;

      const total = data.length;
      const online = data.filter((pc) => pc.status === "online").length;
      const idle = data.filter((pc) => pc.status === "idle").length;
      const offline = total - online - idle;

      setPcList(data);
      setStats({ total, online, idle, offline });
    } catch (err) {
      console.error("❌ Failed to fetch PC list", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = pcList.filter(
    (pc) =>
      (!campusFilter ||
        pc.location?.campus
          ?.toLowerCase()
          .includes(campusFilter.toLowerCase())) &&
      (!roomFilter ||
        pc.location?.room?.toLowerCase().includes(roomFilter.toLowerCase()))
  );

  const paginated = filtered.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(filtered.length / limit);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex-1 bg-zinc-100 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="text-sm text-zinc-600">
              👋 Welcome, {user?.username}
            </p>
          </div>
          <Button onClick={fetchData}>Refresh</Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total PCs", value: stats.total },
            { label: "Online", value: stats.online, color: "text-green-600" },
            { label: "Idle", value: stats.idle, color: "text-yellow-600" },
            { label: "Offline", value: stats.offline, color: "text-red-600" },
          ].map((item, idx) => (
            <Card key={idx}>
              <CardContent className="p-4">
                <div className="text-sm text-zinc-500">{item.label}</div>
                <div className={`text-2xl font-bold ${item.color || ""}`}>
                  {item.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter */}
        {/* Filter + Dropdown Per Halaman */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Filter by Campus"
              className="border px-3 py-2 rounded"
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
            />
            <input
              type="text"
              placeholder="Filter by Room"
              className="border px-3 py-2 rounded"
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
            />
          </div>

          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="border px-3 py-2 rounded text-sm"
          >
            {[5, 10, 20, 50].map((num) => (
              <option key={num} value={num}>
                {num} per halaman
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white shadow rounded overflow-hidden">
          <div className="grid grid-cols-5 bg-zinc-200 text-zinc-600 font-semibold p-4">
            <div>COMPUTER</div>
            <div>USER LOGIN</div>
            <div>LIFECYCLE</div> {/* ✅ kolom baru */}
            <div>LOCATION</div>
            <div>ACTIVITY</div>
          </div>

          {paginated.map((pc) => (
            <div
              key={pc._id}
              className="grid grid-cols-5 items-center border-b p-4 hover:bg-zinc-50 cursor-pointer"
            >
              <div>{pc.serialNumber}</div>
              <div>{pc.userLogin || "-"}</div>
              <div className="capitalize">{pc.lifecycleStatus || "-"}</div>{" "}
              {/* ✅ status lifecycle */}
              <div>
                {pc.location?.campus || "Unknown"},{" "}
                {pc.location?.room || "Room Unknown"}
              </div>
              <div
                className={cn(
                  "font-medium",
                  pc.status === "online"
                    ? "text-green-600"
                    : pc.status === "idle"
                    ? "text-yellow-600"
                    : "text-red-600"
                )}
              >
                {pc.status === "online"
                  ? "Active"
                  : pc.status === "idle"
                  ? "Idle"
                  : "Offline"}
              </div>
            </div>
          ))}
        </div>
        {/* Pagination */}
        <div className="flex justify-center items-center gap-4 mt-4">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ← Prev
          </Button>
          <span className="text-sm text-zinc-700">
            Page {page} of {totalPages}
          </span>
          <Button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next →
          </Button>
        </div>
      </div>
    </div>
  );
}
