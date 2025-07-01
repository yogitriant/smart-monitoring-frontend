import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import api from "@/lib/axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";

export default function OpnameList() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get("/api/opname");
        setReports(res.data);
      } catch (err) {
        console.error("❌ Gagal ambil daftar laporan:", err.message);
        setError("Gagal mengambil laporan.");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  // const handleCopyLink = async (token) => {
  //   const url = `${window.location.origin}/opname/public/${token}`;

  //   try {
  //     if (navigator.clipboard && window.isSecureContext) {
  //       // Modern clipboard API
  //       await navigator.clipboard.writeText(url);
  //     } else {
  //       // Fallback untuk HTTP atau insecure origin
  //       const textarea = document.createElement("textarea");
  //       textarea.value = url;
  //       textarea.style.position = "fixed"; // prevent scroll jump
  //       textarea.style.opacity = 0;
  //       document.body.appendChild(textarea);
  //       textarea.focus();
  //       textarea.select();
  //       document.execCommand("copy");
  //       document.body.removeChild(textarea);
  //     }

  //     alert("🔗 Link publik disalin ke clipboard!");
  //   } catch (err) {
  //     console.error("❌ Gagal menyalin link:", err);
  //     alert("❌ Gagal menyalin link");
  //   }
  // };

  const handleCopyLink = async (token) => {
    const url = `${window.location.origin}/opname/public/${token}`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback untuk HTTP/non-secure
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = 0;
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      Swal.fire({
        icon: "success",
        title: "Link Disalin!",
        text: "🔗 Link publik telah disalin ke clipboard.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("❌ Gagal salin:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal Menyalin",
        text: "Silakan salin manual atau gunakan browser lain.",
      });
    }
  };

  const handleDownloadExcel = () => {
    const exportData = reports.map((r) => ({
      Nama: r.reportName,
      "Dibuat Oleh": r.createdBy,
      Tanggal: new Date(r.createdAt).toLocaleString("id-ID"),
      Token: r.publicToken,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Opname");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const file = new Blob([excelBuffer], { type: "application/octet-stream" });

    saveAs(file, `laporan-opname-${Date.now()}.xlsx`);
  };

  const handleDownloadDetail = (report) => {
    const exportData = report.items.map((item) => ({
      "PC ID": item.pcId,
      Serial: item.serialNumber,
      Asset: item.assetNumber,
      Lokasi: item.location,
      Status: item.status || "-",
      Kondisi: item.kondisi || "-",
      Keterangan: item.keterangan || "-",
      Teknisi: item.updatedBy || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, report.reportName);

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const file = new Blob([excelBuffer], { type: "application/octet-stream" });

    saveAs(file, `opname-${report.reportName}-${Date.now()}.xlsx`);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Yakin ingin menghapus laporan ini?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/api/opname/${id}`);
      setReports((prev) => prev.filter((r) => r._id !== id));
      alert("🗑️ Laporan berhasil dihapus.");
    } catch (err) {
      console.error("❌ Gagal hapus laporan:", err.message);
      alert("❌ Gagal menghapus laporan.");
    }
  };

  const filteredReports = reports.filter(
    (r) =>
      r.reportName.toLowerCase().includes(filter.toLowerCase()) ||
      r.createdBy.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 bg-zinc-100 p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">📋 Daftar Laporan Opname</h2>

        <div className="flex justify-between items-center mb-4">
          <input
            type="text"
            placeholder="🔍 Cari nama atau pembuat laporan..."
            className="p-2 border rounded text-sm w-full max-w-md"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button
            onClick={handleDownloadExcel}
            className="ml-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
          >
            ⬇️ Download Excel
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">Loading laporan...</p>
        ) : error ? (
          <p className="text-red-600 text-sm">{error}</p>
        ) : filteredReports.length === 0 ? (
          <p className="text-sm text-zinc-500">Tidak ada laporan yang cocok.</p>
        ) : (
          <table className="w-full text-sm border bg-white rounded shadow">
            <thead>
              <tr className="bg-zinc-200 text-left">
                <th className="p-2">Nama</th>
                <th className="p-2">Dibuat Oleh</th>
                <th className="p-2">Tanggal</th>
                <th className="p-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((r) => (
                <tr key={r._id} className="border-t hover:bg-zinc-50">
                  <td className="p-2">{r.reportName}</td>
                  <td className="p-2">{r.createdBy}</td>
                  <td className="p-2">
                    {new Date(r.createdAt).toLocaleString("id-ID")}
                  </td>
                  <td className="p-2 space-x-3">
                    <Link
                      to={`/opname/${r._id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Detail
                    </Link>
                    <button
                      onClick={() => handleCopyLink(r.publicToken)}
                      className="text-green-600 hover:underline"
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={() => handleDownloadDetail(r)}
                      className="text-purple-600 hover:underline"
                    >
                      Download
                    </button>
                    <Link
                      to={`/opname/edit/${r._id}`}
                      className="text-yellow-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(r._id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
