import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import Sidebar from "@/components/Sidebar";

export default function Settings() {
  const { user } = useAuth();
  
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (newPassword !== confirmPassword) {
      setPwdError("Password baru tidak cocok.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/change-password`,
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPwdSuccess(res.data.message);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      setPwdError(err.response?.data?.message || "Gagal mengubah password.");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 bg-slate-50 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200/60 px-8 py-5">
          <h2 className="text-xl font-bold text-zinc-800">Settings</h2>
          <p className="text-sm text-zinc-400 mt-0.5">Application configuration</p>
        </div>
        <div className="p-8 space-y-6">

        {/* Info user */}
        <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm p-5 space-y-4">
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Username</p>
            <p className="text-sm font-medium text-zinc-700 mt-1">{user?.username}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Role</p>
            <p className="text-sm font-medium text-zinc-700 mt-1 capitalize">{user?.role}</p>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm p-5 space-y-4">
          <h3 className="text-lg font-semibold">🔑 Ubah Password</h3>
          {pwdError && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">{pwdError}</div>}
          {pwdSuccess && <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-sm border border-emerald-200">{pwdSuccess}</div>}
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Password Lama</label>
              <div className="relative">
                <input
                  type={showOldPassword ? "text" : "password"}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 pr-10"
                />
                <button type="button" onClick={() => setShowOldPassword(!showOldPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
                  {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Password Baru (Kombinasi huruf besar, kecil, angka, spesial min 8)</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 pr-10"
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Konfirmasi Password Baru</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 pr-10"
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" variant="default" className="w-full">Ubah Password</Button>
          </form>
        </div>

        </div>
      </div>
    </div>
  );
}
