// src/components/ui/AgentVersionTable.jsx
import React, { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { Button } from "./button";

export default function AgentVersionTable({ onRefresh }) {
  const [versions, setVersions] = useState([]);

  const fetchVersions = async () => {
    try {
      const res = await axios.get("/api/agent/versions");
      setVersions(res.data);
    } catch (err) {
      console.error("❌ Gagal fetch versi:", err);
    }
  };

  const handleDelete = async (version) => {
    if (!confirm(`Hapus versi ${version}?`)) return;
    try {
      await axios.delete(`/api/agent/version/${version}`);
      fetchVersions();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("❌ Gagal hapus versi:", err);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">Daftar Versi Agent</h3>
      <table className="w-full bg-white border rounded shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Version</th>
            <th className="p-2 text-left">Uploaded</th>
            <th className="p-2 text-left">Changelog</th>
            <th className="p-2 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {versions.map((v) => (
            <tr key={v.version} className="border-t hover:bg-gray-50">
              <td className="p-2">{v.version}</td>
              <td className="p-2">{new Date(v.uploadDate).toLocaleString()}</td>
              <td className="p-2">{v.changelog || "-"}</td>
              <td className="p-2">
                <Button
                  onClick={() => handleDelete(v.version)}
                  variant="destructive"
                  size="sm"
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
