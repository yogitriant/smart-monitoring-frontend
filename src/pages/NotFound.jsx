import React from "react";
import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-100 rounded-2xl mb-5">
          <FileQuestion className="w-8 h-8 text-zinc-400" />
        </div>
        <h1 className="text-3xl font-bold text-zinc-800 mb-2">404</h1>
        <p className="text-zinc-400 mb-6">Halaman yang kamu cari tidak tersedia.</p>
        <Link to="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium text-sm hover:bg-primary-700 transition-all shadow-md shadow-primary-600/25">
          ← Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
