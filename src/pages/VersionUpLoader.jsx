// src/pages/VersionUploader.jsx
import React, { useState } from "react";
import axios from "@/lib/axios";

export default function VersionUploader() {
  const [file, setFile] = useState(null);
  const [version, setVersion] = useState("");
  const [changelog, setChangelog] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("agentZip", file);
    fd.append("version", version);
    fd.append("changelog", changelog);

    await axios.post("/api/agent/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    alert("Upload sukses!");
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Upload Agent ZIP</h2>
      <input
        type="text"
        placeholder="Version (e.g. 1.3.0)"
        value={version}
        onChange={(e) => setVersion(e.target.value)}
        className="block mb-2 w-full border px-2 py-1 rounded"
        required
      />
      <textarea
        placeholder="Changelog"
        value={changelog}
        onChange={(e) => setChangelog(e.target.value)}
        className="block mb-2 w-full border px-2 py-1 rounded"
      />
      <input
        type="file"
        accept=".zip"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-4"
        required
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Upload
      </button>
    </form>
  );
}
