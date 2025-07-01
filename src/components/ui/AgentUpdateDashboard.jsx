import React, { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { io } from "socket.io-client";
import { Button } from "./button.jsx";
import UploadAgentZip from "./UploadAgentZip";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function AgentUpdateDashboard() {
  const [versions, setVersions] = useState([]);
  const [pcs, setPcs] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [selectedPcs, setSelectedPcs] = useState(new Set());
  const [logs, setLogs] = useState([]);
  const [socket, setSocket] = useState(null);

  const fetchAllData = async () => {
    try {
      const [vRes, pcRes, logRes] = await Promise.all([
        axios.get("/api/agent/versions"),
        axios.get("/api/pc/list"),
        axios.get("/api/agent/logs?limit=50"),
      ]);
      setVersions(vRes.data);
      setPcs(pcRes.data);
      setLogs(logRes.data);
      if (vRes.data.length) setSelectedVersion(vRes.data[0].version);
    } catch (err) {
      console.error("❌ Gagal fetch data awal:", err);
    }
  };

  useEffect(() => {
    fetchAllData();

    const sock = io(API_BASE); // hapus transports: ['websocket']
    sock.on("connect", () => {
      console.log("✅ Socket connected:", sock.id);
    });

    sock.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    sock.on("agent-update-result", (data) => {
      setLogs((prev) => [data, ...prev.slice(0, 49)]);
    });

    setSocket(sock);

    return () => sock.disconnect();
  }, []);

  const togglePc = (pcId) => {
    setSelectedPcs((prev) => {
      const next = new Set(prev);
      next.has(pcId) ? next.delete(pcId) : next.add(pcId);
      return next;
    });
  };

  const pushAction = async (action) => {
    if (!selectedVersion || selectedPcs.size === 0 || !socket) return;

    try {
      const res = await axios.post("/api/agent/push", {
        action,
        version: selectedVersion,
        pcIds: Array.from(selectedPcs),
      });

      console.log("✅ Push acknowledged:", res.data);

      Array.from(selectedPcs).forEach((pcId) => {
        socket.emit("agent-update", {
          pcId,
          version: selectedVersion,
          silent: true,
          force: false,
          action,
        });
      });
    } catch (err) {
      console.error("❌ Gagal push action:", err);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Agent Update Dashboard</h2>

      <UploadAgentZip onUploaded={fetchAllData} />

      <div className="my-6">
        <h3 className="font-semibold mb-2">Versi Tersedia</h3>
        <table className="w-full bg-white border rounded shadow mb-4">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Version</th>
              <th className="p-2 text-left">Upload Date</th>
              <th className="p-2 text-left">Changelog</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {versions.map((v) => (
              <tr key={v.version} className="border-t hover:bg-gray-50">
                <td className="p-2">{v.version}</td>
                <td className="p-2">
                  {new Date(v.uploadDate).toLocaleString()}
                </td>
                <td className="p-2">{v.changelog || "-"}</td>
                <td className="p-2">
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      if (confirm(`Hapus versi ${v.version}?`)) {
                        await axios.delete(`/api/agent/versions/${v.version}`);
                        fetchAllData();
                      }
                    }}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <label className="font-medium">Select Version:</label>
        <select
          value={selectedVersion}
          onChange={(e) => setSelectedVersion(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          {versions.map((v) => (
            <option key={v.version} value={v.version}>
              {v.version}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">Pilih PC</h3>
        <table className="w-full bg-white border rounded shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Pilih</th>
              <th className="p-2 text-left">PC ID</th>
              <th className="p-2 text-left">Serial</th>
              <th className="p-2 text-left">Asset</th>
              <th className="p-2 text-left">Lokasi</th>
              <th className="p-2 text-left">PIC</th>
              <th className="p-2 text-left">Versi</th>
              <th className="p-2 text-left">RAM</th>
              <th className="p-2 text-left">Storage</th>
            </tr>
          </thead>
          <tbody>
            {pcs.map((pc) => (
              <tr key={pc._id} className="border-t hover:bg-gray-50">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selectedPcs.has(pc._id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedPcs);
                      if (e.target.checked) {
                        newSelected.add(pc._id); // ⬅️ pakai _id Mongo
                      } else {
                        newSelected.delete(pc._id);
                      }
                      setSelectedPcs(newSelected);
                    }}
                  />
                </td>
                <td className="p-2">{pc.pcId}</td>
                <td className="p-2">{pc.serialNumber || "-"}</td>
                <td className="p-2">{pc.assetNumber || "-"}</td>
                <td className="p-2">
                  {pc.location?.category || "Unknown"} -{" "}
                  {pc.location?.floor || "Unknown"}
                </td>
                <td className="p-2">{pc.pic || "-"}</td>
                <td className="p-2">{pc.version || "-"}</td>
                <td className="p-2">
                  {pc.spec?.ram ? `${pc.spec.ram} GB` : "-"}
                </td>
                <td className="p-2">
                  {pc.spec?.storage
                    ? `${pc.spec.storage.size || "-"} ${
                        pc.spec.storage.type || ""
                      }`
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2 mb-6">
        <Button onClick={() => pushAction("update")}>Push Update</Button>
        {/* <Button onClick={() => pushAction("rollback")} variant="destructive">
          Push Rollback
        </Button> */}
      </div>

      <h3 className="text-lg font-semibold mb-2">Recent Logs</h3>
      <table className="w-full bg-white rounded shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Time</th>
            <th className="p-2 text-left">PC ID</th>
            <th className="p-2 text-left">Version</th>
            <th className="p-2 text-left">Action</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Message</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log._id} className="border-b hover:bg-gray-50">
              <td className="p-2">
                {new Date(log.timestamp).toLocaleString()}
              </td>
              <td className="p-2">{log.pcId}</td>
              <td className="p-2">{log.version}</td>
              <td className="p-2">{log.action}</td>
              <td className="p-2">{log.status}</td>
              <td className="p-2">{log.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
