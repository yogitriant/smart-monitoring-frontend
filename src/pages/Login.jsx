import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext"; // ⬅️ Context login
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState(""); // email atau username
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const handleLogin = async (e) => {
    console.log("🟡 Mulai login");
    e.preventDefault();

    if (!identifier || !password) {
      setError("Email/Username dan Password wajib diisi.");
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/login`,
        { email: identifier, password }
      );

      console.log("✅ Login success:", res.data);
      login(res.data.user, res.data.token);
      navigate(from, { replace: true }); // ✅ kembali ke halaman sebelum login
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      setError(
        err.response?.data?.message ||
          "Login gagal. Cek email/username dan password."
      );
    }
  };

  useEffect(() => {
    setIdentifier("");
    setPassword("");
    setError("");
  }, [location.pathname]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-100 px-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-zinc-800">
          Login Smart Monitoring
        </h1>

        {error && (
          <div className="mb-4 text-red-600 text-sm text-center">{error}</div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Email atau Username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-4 py-2 border border-zinc-300 rounded focus:outline-none focus:ring focus:border-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-zinc-300 rounded focus:outline-none focus:ring focus:border-blue-500"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>

        <div className="mt-4 text-sm text-center text-zinc-600">
          Belum punya akun?{" "}
          <a href="/register" className="text-blue-600 hover:underline">
            Daftar di sini
          </a>
        </div>
      </div>
    </div>
  );
}
