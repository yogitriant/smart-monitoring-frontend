import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Trash2, Pencil, Plus, X } from "lucide-react";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { user } = useAuth();

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    _id: null,
    username: "",
    email: "",
    password: "",
    role: "user",
    site: "",
    department: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const [usersRes, sitesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/region-site-items`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUsers(usersRes.data);
      // Extraksi daftar site unik dari region-site-items
      const uniqueSites = [...new Set(sitesRes.data.map(item => item.site).filter(Boolean))];
      setSites(uniqueSites);
    } catch (err) { 
        console.error("Gagal ambil data:", err.message); 
    } finally { 
        setLoading(false); 
    }
  };

  const deleteUser = async (id) => {
    if (!confirm("Yakin ingin menghapus user ini?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) { alert("❌ Gagal hapus user."); }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({ _id: null, username: "", email: "", password: "", role: "user", site: "", department: "" });
    setShowModal(true);
  };

  const openEditModal = (u) => {
    setIsEditing(true);
    setFormData({
      _id: u._id,
      username: u.username,
      email: u.email,
      password: "", // Jangan tampilkan password lama
      role: u.role,
      site: u.site || "",
      department: u.department || "",
    });
    setShowModal(true);
  };

  const generateStrongPassword = () => {
    const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowers = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const specials = "@$!%*?&.";
    const all = uppers + lowers + numbers + specials;
    
    let pass = "";
    pass += uppers[Math.floor(Math.random() * uppers.length)];
    pass += lowers[Math.floor(Math.random() * lowers.length)];
    pass += numbers[Math.floor(Math.random() * numbers.length)];
    pass += specials[Math.floor(Math.random() * specials.length)];
    
    for (let i = 4; i < 12; i++) {
        pass += all[Math.floor(Math.random() * all.length)];
    }
    
    pass = pass.split('').sort(() => 0.5 - Math.random()).join('');
    setFormData({ ...formData, password: pass });
  };

  const saveUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const payload = { ...formData };
      if (isEditing && !payload.password) {
        delete payload.password; // Jangan kirim password kosong jika edit
      }

      if (isEditing) {
        const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/users/${payload._id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        setUsers(users.map(u => u._id === payload._id ? res.data.user : u));
      } else {
        const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/users`, payload, { headers: { Authorization: `Bearer ${token}` } });
        setUsers([res.data.user, ...users]);
      }
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.message || "❌ Gagal menyimpan user.");
    }
  };

  const handleSort = (field) => {
    setSortOrder(sortField === field && sortOrder === "asc" ? "desc" : "asc");
    setSortField(field);
  };

  const filtered = useMemo(() => {
    let result = users.filter((u) => {
      const q = searchQ.toLowerCase();
      const matchSearch = !q || u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      const matchRole = !roleFilter || u.role === roleFilter;
      return matchSearch && matchRole;
    });
    if (sortField) {
      result = [...result].sort((a, b) => {
        const va = (a[sortField] || "").toString().toLowerCase();
        const vb = (b[sortField] || "").toString().toLowerCase();
        return sortOrder === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }
    return result;
  }, [users, searchQ, roleFilter, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * limit, currentPage * limit);

  const SortHeader = ({ field, label }) => (
    <th onClick={() => handleSort(field)} className="text-left text-[12px] font-semibold text-zinc-400 uppercase tracking-wider px-5 py-3.5 cursor-pointer select-none hover:text-zinc-600 transition-colors">
      <span className="inline-flex items-center gap-1">{label} {sortField === field ? <span className="text-primary-500">{sortOrder === "asc" ? "↑" : "↓"}</span> : <ArrowUpDown className="w-3 h-3 opacity-40" />}</span>
    </th>
  );

  const roleBadge = (role) => {
    const styles = { superadmin: "bg-purple-50 text-purple-700 border-purple-200", admin: "bg-blue-50 text-blue-700 border-blue-200", user: "bg-zinc-100 text-zinc-600 border-zinc-200" };
    return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${styles[role] || styles.user}`}>{role}</span>;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 bg-slate-50 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200/60 px-8 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-zinc-800">Users</h2>
            <p className="text-sm text-zinc-400 mt-0.5">{filtered.length} users found</p>
          </div>
          {user?.role === "superadmin" && (
            <button
                onClick={openAddModal}
                className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition"
            >
                <Plus className="w-4 h-4" /> Add User
            </button>
          )}
        </div>
        <div className="p-8 space-y-5">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input placeholder="Search name or email..." value={searchQ} onChange={(e) => { setSearchQ(e.target.value); setPage(1); }} className="pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm w-56 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            </div>
            <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20">
              <option value="">All roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
            <div className="ml-auto">
              <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  <SortHeader field="username" label="Username" />
                  <SortHeader field="email" label="Email" />
                  <SortHeader field="role" label="Role" />
                  <SortHeader field="site" label="Site" />
                  <SortHeader field="department" label="Department" />
                  <SortHeader field="createdAt" label="Created" />
                  <th className="text-center text-[12px] font-semibold text-zinc-400 uppercase tracking-wider px-5 py-3.5">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-zinc-50">{[...Array(7)].map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-zinc-100 rounded-lg animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} /></td>)}</tr>
                )) : paginated.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-sm text-zinc-400">Tidak ada data ditemukan</td></tr>
                ) : paginated.map((u) => (
                  <tr key={u._id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-zinc-700">{u.username}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-600">{u.email}</td>
                    <td className="px-5 py-3.5">{roleBadge(u.role)}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-600">{u.site || "-"}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-600">{u.department || "-"}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-center">
                      {user?.role === "superadmin" && (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEditModal(u)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-all" title="Edit user">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteUser(u._id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-all" title="Delete user">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-400">Showing {Math.min((currentPage - 1) * limit + 1, filtered.length)}–{Math.min(currentPage * limit, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-zinc-600 font-medium px-3">{currentPage} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal User Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-100">
              <h3 className="text-lg font-bold text-zinc-800">{isEditing ? "Edit User" : "Add New User"}</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md hover:bg-zinc-100 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Username</label>
                <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
                <div className="flex items-center gap-2">
                    <input type="text" required={!isEditing} placeholder={isEditing ? "Kosongkan jika tidak ingin diubah" : ""} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="flex-1 w-full border border-zinc-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                    <button type="button" onClick={generateStrongPassword} className="px-3 py-2 bg-zinc-100 border border-zinc-300 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-200 transition">
                        Generate
                    </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Role</label>
                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white">
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Site</label>
                    <select value={formData.site} onChange={e => setFormData({...formData, site: e.target.value})} className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white">
                        <option value="">No Site</option>
                        {sites.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Department</label>
                <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" placeholder="Opsional" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition shadow-sm">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
