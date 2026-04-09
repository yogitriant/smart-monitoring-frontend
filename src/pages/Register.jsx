import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Monitor, UserPlus, Eye, EyeOff } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    if (!form.username || !form.email || !form.password) { setError("Semua field wajib diisi."); setLoading(false); return; }
    try {
      await axios.post(`${BASE_URL}/api/register`, form);
      setSuccess("Registrasi berhasil! Mengarahkan ke login...");
      setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Registrasi gagal.");
    } finally { setLoading(false); }
  };

  const inputClass = "w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl shadow-lg shadow-primary-600/25 mb-4">
            <Monitor className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-800">Create Account</h1>
          <p className="text-sm text-zinc-400 mt-1">Register for Smart Monitor</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200/60 p-8">
          {error && <div className="mb-5 bg-red-50 border border-red-200/80 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
          {success && <div className="mb-5 bg-emerald-50 border border-emerald-200/80 text-emerald-600 text-sm px-4 py-3 rounded-xl">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-zinc-600 mb-2">Username</label>
              <input name="username" placeholder="Enter your username" value={form.username} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-zinc-600 mb-2">Email</label>
              <input name="email" type="email" placeholder="Enter your email" value={form.email} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-zinc-600 mb-2">Password</label>
              <div className="relative">
                <input name="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={form.password} onChange={handleChange} className={`${inputClass} pr-11`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-primary-700 active:scale-[0.98] transition-all duration-200 shadow-md shadow-primary-600/25 disabled:opacity-60">
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-zinc-400">Already have an account? <a href="/login" className="text-primary-600 font-medium hover:text-primary-700 transition-colors">Sign in</a></span>
          </div>
        </div>
      </div>
    </div>
  );
}
