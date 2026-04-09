import React, { useState } from "react";
import axios from "@/lib/axios";
import { Upload, FileArchive } from "lucide-react";

export default function UploadAgentZip({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [version, setVersion] = useState("");
  const [changelog, setChangelog] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !version) { setMessage("File dan versi wajib diisi"); return; }

    const formData = new FormData();
    formData.append("agentZip", file);
    formData.append("version", version);
    formData.append("changelog", changelog);
    formData.append("uploadedBy", localStorage.getItem("user") || "admin");

    try {
      setUploading(true);
      const res = await axios.post("/api/agent/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      if (onUploaded) onUploaded();
      setMessage(`✅ Berhasil upload: ${res.data.version}`);
      setFile(null); setVersion(""); setChangelog("");
    } catch (err) {
      setMessage(`❌ Gagal upload: ${err.response?.data?.error || err.message}`);
    } finally { setUploading(false); }
  };

  const inputClass = "w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all";

  return (
    <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm p-5">
      <h3 className="text-sm font-semibold text-zinc-700 mb-4 flex items-center gap-2">
        <FileArchive className="w-4 h-4 text-primary-500" /> Upload Agent ZIP
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">ZIP File</label>
          <input type="file" accept=".zip" onChange={(e) => setFile(e.target.files[0])} className="block w-full text-sm text-zinc-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100 file:cursor-pointer file:transition-colors" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Version</label>
            <input type="text" placeholder="e.g. 1.0.3" value={version} onChange={(e) => setVersion(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Changelog</label>
            <input type="text" placeholder="Optional" value={changelog} onChange={(e) => setChangelog(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={uploading} className="inline-flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-all shadow-sm disabled:opacity-60">
            <Upload className="w-4 h-4" /> {uploading ? "Uploading..." : "Upload"}
          </button>
          {message && <span className={`text-sm ${message.startsWith("✅") ? "text-emerald-600" : "text-red-500"}`}>{message}</span>}
        </div>
      </form>
    </div>
  );
}
