import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 text-center p-6">
      <div>
        <h1 className="text-4xl font-bold text-zinc-800 mb-2">
          404 - Halaman Tidak Ditemukan
        </h1>
        <p className="text-zinc-600 mb-4">
          Ups, halaman yang kamu cari tidak tersedia.
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
