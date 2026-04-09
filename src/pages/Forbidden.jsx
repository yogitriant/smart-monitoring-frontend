import React from "react";
import { Link } from "react-router-dom";
import { ShieldOff } from "lucide-react";

export default function Forbidden() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-2xl mb-5">
          <ShieldOff className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-zinc-800 mb-2">403</h1>
        <p className="text-zinc-400 mb-6">Kamu tidak punya izin untuk mengakses halaman ini.</p>
        <Link to="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium text-sm hover:bg-primary-700 transition-all shadow-md shadow-primary-600/25">
          ← Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
