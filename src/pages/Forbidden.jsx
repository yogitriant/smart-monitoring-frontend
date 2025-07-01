import React from "react";
import { Link } from "react-router-dom";

export default function Forbidden() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 text-center p-6">
      <div>
        <h1 className="text-4xl font-bold text-red-600 mb-2">
          403 - Akses Ditolak
        </h1>
        <p className="text-zinc-700 mb-4">
          Kamu tidak punya izin untuk mengakses halaman ini.
        </p>
        <Link
          to="/dashboard"
          className="text-blue-600 hover:underline font-medium"
        >
          ← Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
