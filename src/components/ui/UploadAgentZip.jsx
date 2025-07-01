import React, { useState } from "react";
import axios from "@/lib/axios";

export default function UploadAgentZip({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [version, setVersion] = useState("");
  const [changelog, setChangelog] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file || !version) {
      setMessage("❌ File dan versi wajib diisi");
      return;
    }

    const formData = new FormData();
    formData.append("agentZip", file);
    formData.append("version", version);
    formData.append("changelog", changelog);
    formData.append("uploadedBy", localStorage.getItem("user") || "admin");

    try {
      const res = await axios.post("/api/agent/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // ✅ Pastikan fungsi ini dipanggil hanya jika didefinisikan
      if (onUploaded) onUploaded();

      setMessage(`✅ Berhasil upload: ${res.data.version}`);
    } catch (err) {
      setMessage(
        `❌ Gagal upload: ${err.response?.data?.error || err.message}`
      );
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow mb-6">
      <h3 className="text-lg font-semibold mb-2">Upload Agent ZIP</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="file"
          accept=".zip"
          onChange={(e) => setFile(e.target.files[0])}
          className="block"
        />
        <input
          type="text"
          placeholder="Version (e.g. 1.0.3)"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          className="border p-1 w-full"
        />
        <textarea
          placeholder="Changelog (opsional)"
          value={changelog}
          onChange={(e) => setChangelog(e.target.value)}
          className="border p-1 w-full"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          Upload
        </button>
        {message && <p className="text-sm">{message}</p>}
      </form>
    </div>
  );
}
