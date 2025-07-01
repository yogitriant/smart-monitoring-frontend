import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://10.20.0.71:3000";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validasi dasar
    if (!form.username || !form.email || !form.password) {
      setError("Semua field wajib diisi.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError("Format email tidak valid.");
      return;
    }

    try {
      await axios.post(`${BASE_URL}/api/register`, form);
      setSuccess("Registrasi berhasil! Mengarahkan ke login...");
      setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Registrasi gagal. Coba gunakan username/email lain."
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold mb-4 text-center text-zinc-800">
          Register
        </h2>

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        {success && (
          <p className="text-green-600 text-sm text-center">{success}</p>
        )}

        <Input
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          required
        />
        <Input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <Input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <Button type="submit" className="w-full">
          Register
        </Button>

        <div className="mt-2 text-sm text-center text-zinc-600">
          Sudah punya akun?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Masuk di sini
          </a>
        </div>
      </form>
    </div>
  );
}
