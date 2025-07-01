import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext"; // ⬅️ untuk cek role user

export default function UserList() {
  const [users, setUsers] = useState([]);
  const { user } = useAuth(); // ⬅️ ambil role saat ini

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/users`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUsers(res.data);
      } catch (err) {
        console.error("Gagal ambil data user:", err.message);
      }
    };
    fetchUsers();
  }, []);

  const updateRole = async (id, newRole) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/api/users/${id}/role`,
        { role: newRole },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, role: newRole } : u))
      );

      alert("✅ Role berhasil diperbarui.");
    } catch (err) {
      alert("❌ Gagal ubah role.");
      console.error(err.message);
    }
  };

  const deleteUser = async (id) => {
    const confirmDelete = confirm("Yakin ingin menghapus user ini?");
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/api/users/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsers((prev) => prev.filter((u) => u._id !== id));
      alert("✅ User berhasil dihapus.");
    } catch (err) {
      alert("❌ Gagal hapus user.");
      console.error(err.message);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 bg-zinc-100 p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>👥</span> Daftar Pengguna
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-4 py-2">Username</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Dibuat</th>
                <th className="px-4 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="px-4 py-2">{u.username}</td>
                  <td className="px-4 py-2">{u.email}</td>

                  {/* Kolom Role */}
                  <td className="px-4 py-2">
                    {user?.role === "superadmin" ? (
                      <select
                        value={u.role}
                        onChange={(e) => updateRole(u._id, e.target.value)}
                        className="border px-2 py-1 rounded"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                        <option value="superadmin">superadmin</option>
                      </select>
                    ) : (
                      u.role
                    )}
                  </td>

                  {/* Kolom Dibuat */}
                  <td className="px-4 py-2">
                    {new Date(u.createdAt).toLocaleString()}
                  </td>

                  {/* Kolom Aksi */}
                  <td className="px-4 py-2">
                    {user?.role === "superadmin" && (
                      <button
                        onClick={() => deleteUser(u._id)}
                        className="bg-red-600 text-white text-xs px-3 py-1 rounded hover:bg-red-700"
                      >
                        Hapus
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
