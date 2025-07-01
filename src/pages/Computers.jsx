import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/Sidebar";
import { Link } from "react-router-dom";
import axios from "@/lib/axios";
import { cn } from "@/lib/utils";

export default function Computers() {
  const [computers, setComputers] = useState([]);
  const [filter, setFilter] = useState({ campus: "", room: "", pic: "" });
  const [page, setPage] = useState(1);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    fetchComputers();
  }, []);

  const fetchComputers = async () => {
    try {
      const res = await axios.get("/api/pc/list");
      setComputers(res.data);
    } catch (err) {
      console.error("❌ Gagal ambil data komputer:", err);
    }
  };

  const handleFilter = (comp) => {
    if (showUnassignedOnly) {
      return !comp.location || comp.location.campus === "Unknown";
    }

    return (
      (!filter.campus ||
        comp.location?.campus
          ?.toLowerCase()
          .includes(filter.campus.toLowerCase())) &&
      (!filter.room ||
        comp.location?.room
          ?.toLowerCase()
          .includes(filter.room.toLowerCase())) &&
      (!filter.pic ||
        comp.pic?.toLowerCase().includes(filter.pic.toLowerCase()))
    );
  };

  const filtered = computers.filter(handleFilter);
  const totalPages = Math.ceil(filtered.length / limit);
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 bg-zinc-100 p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">👤 Computers</h2>

        {/* Filter */}
        {/* Filter + Dropdown Limit */}
        <div className="flex flex-wrap items-end gap-4 mb-4">
          <Input
            placeholder="Filter by Campus"
            value={filter.campus}
            onChange={(e) => setFilter({ ...filter, campus: e.target.value })}
            className="w-48 border px-3 py-2 rounded"
          />
          <Input
            placeholder="Filter by Room"
            value={filter.room}
            onChange={(e) => setFilter({ ...filter, room: e.target.value })}
            className="w-48 border px-3 py-2 rounded"
          />
          <Input
            placeholder="Filter by PIC"
            value={filter.pic}
            onChange={(e) => setFilter({ ...filter, pic: e.target.value })}
            className="w-48 border px-3 py-2 rounded"
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="unassigned"
              checked={showUnassignedOnly}
              onChange={(e) => setShowUnassignedOnly(e.target.checked)}
              className="w-4 h-4"
            />
            <label
              htmlFor="unassigned"
              className="text-sm text-zinc-700 whitespace-nowrap"
            >
              🔍 Tampilkan hanya PC tanpa lokasi
            </label>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1); // reset ke halaman 1 saat ganti limit
              }}
              className="border border-zinc-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n} per halaman
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow rounded overflow-hidden">
          <div className="grid grid-cols-7 bg-zinc-200 text-zinc-600 font-semibold p-4">
            <div>PIC</div>
            <div>Serial Number</div>
            <div>Asset Number</div>
            <div>User Login</div>
            <div>Location</div>
            <div>Status</div>
            <div>Action</div>
          </div>

          {paginated.map((pc) => (
            <div
              key={pc._id}
              className="grid grid-cols-7 items-center border-b p-4 hover:bg-zinc-50"
            >
              <div>{pc.pic || "-"}</div>
              <div>{pc.serialNumber}</div>
              <div>{pc.assetNumber || "-"}</div>
              <div>{pc.userLogin || "-"}</div>
              <div>
                {pc.location
                  ? `${pc.location.campus}, ${pc.location.room} (${pc.location.category})`
                  : "-"}
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
                {pc.status}
              </div>
              <div>
                <Link to={`/computers/${pc._id}`}>
                  <Button size="sm" variant="outline">
                    Detail
                  </Button>
                </Link>
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
