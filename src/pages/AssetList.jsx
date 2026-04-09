import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Link, useNavigate } from "react-router-dom";
import axios from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import {
    Search, ChevronLeft, ChevronRight, ArrowUpDown,
    ExternalLink, Plus, Package, Filter,
} from "lucide-react";

const STATUS_COLORS = {
    Deployed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Reserve: "bg-blue-50 text-blue-700 border-blue-200",
    Received: "bg-purple-50 text-purple-700 border-purple-200",
    "On Loan": "bg-amber-50 text-amber-700 border-amber-200",
    Down: "bg-red-50 text-red-700 border-red-200",
    Inventory: "bg-teal-50 text-teal-700 border-teal-200",
    Disposed: "bg-zinc-100 text-zinc-500 border-zinc-300",
};

export default function AssetList() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterSite, setFilterSite] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [sortField, setSortField] = useState(null);
    const [sortOrder, setSortOrder] = useState("asc");
    const [filters, setFilters] = useState({ statuses: [], categories: [], sites: [] });

    // Fetch filter options
    useEffect(() => {
        axios.get("/api/assets/filters").then((res) => setFilters(res.data)).catch(() => { });
    }, []);

    // Fetch assets
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const params = { page, limit };
                if (search) params.search = search;
                if (filterStatus) params.status = filterStatus;
                if (filterCategory) params.productCategory = filterCategory;
                if (filterSite) params.site = filterSite;
                if (sortField) {
                    params.sortBy = sortField;
                    params.sortOrder = sortOrder;
                }
                const res = await axios.get("/api/assets", { params });
                setAssets(res.data.assets || []);
                setTotalPages(res.data.totalPages || 1);
                setTotal(res.data.total || 0);
            } catch (err) {
                console.error("❌ Gagal ambil assets:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [page, limit, search, filterStatus, filterCategory, filterSite, sortField, sortOrder]);

    const handleSort = (field) => {
        const order = sortField === field && sortOrder === "asc" ? "desc" : "asc";
        setSortField(field);
        setSortOrder(order);
    };

    const statusBadge = (status) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap ${STATUS_COLORS[status] || STATUS_COLORS.Reserve}`}>
            {status || "-"}
        </span>
    );

    const thBase = "text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3 py-2.5 whitespace-nowrap";

    const SortHeader = ({ field, label, className = "" }) => (
        <th onClick={() => handleSort(field)} className={`${thBase} cursor-pointer select-none hover:text-zinc-600 transition-colors ${className}`}>
            <span className="inline-flex items-center gap-1">
                {label}
                {sortField === field ? <span className="text-primary-500">{sortOrder === "asc" ? "↑" : "↓"}</span> : <ArrowUpDown className="w-3 h-3 opacity-40" />}
            </span>
        </th>
    );

    const formatDate = (d) => {
        if (!d) return "-";
        return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 bg-slate-50 overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200/60 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
                                <Package className="w-5 h-5 text-primary-600" /> Asset Management
                            </h2>
                            <p className="text-xs text-zinc-400">{total} assets found</p>
                        </div>
                        <button
                            onClick={() => navigate("/assets/create")}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Add Asset
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                                placeholder="Search FA, SN, product, owner..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm w-64 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                            className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        >
                            <option value="">All Status</option>
                            {["Deployed", "Reserve", "Received", "On Loan", "Down", "Inventory", "Disposed"].map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <select
                            value={filterCategory}
                            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
                            className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        >
                            <option value="">All Category</option>
                            {["Hardware", "Software", "Network", "Other"].map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        {user?.role !== "user" && filters.sites?.length > 0 && (
                            <select
                                value={filterSite}
                                onChange={(e) => { setFilterSite(e.target.value); setPage(1); }}
                                className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            >
                                <option value="">All Sites</option>
                                {filters.sites.filter(Boolean).map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        )}
                        <div className="ml-auto">
                            <select
                                value={limit}
                                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                                className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            >
                                {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full table-fixed">
                                <colgroup>
                                    <col style={{ width: "11%" }} />
                                    <col style={{ width: "11%" }} />
                                    <col style={{ width: "10%" }} />
                                    <col style={{ width: "15%" }} />
                                    <col style={{ width: "10%" }} />
                                    <col style={{ width: "9%" }} />
                                    <col style={{ width: "10%" }} />
                                    <col style={{ width: "10%" }} />
                                    <col style={{ width: "9%" }} />
                                    <col style={{ width: "5%" }} />
                                </colgroup>
                                <thead>
                                    <tr className="border-b border-zinc-100 bg-zinc-50/50">
                                        <SortHeader field="faNumber" label="FA Number" />
                                        <SortHeader field="serialNumber" label="Serial Number" />
                                        <SortHeader field="productCategory" label="Category" />
                                        <SortHeader field="productName" label="Product Name" />
                                        <SortHeader field="manufacturer" label="Manufacturer" />
                                        <SortHeader field="site" label="Site" />
                                        <SortHeader field="ownerFullname" label="Owner" />
                                        <SortHeader field="status" label="Status" />
                                        <th className={thBase}>Warranty</th>
                                        <th className={`${thBase} text-center`}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i} className="border-b border-zinc-50">
                                                {[...Array(10)].map((_, j) => (
                                                    <td key={j} className="px-3 py-2.5">
                                                        <div className="h-3.5 bg-zinc-100 rounded animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : assets.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="text-center py-12 text-sm text-zinc-400">
                                                Tidak ada asset ditemukan
                                            </td>
                                        </tr>
                                    ) : (
                                        assets.map((asset) => (
                                            <tr key={asset._id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                                                <td className="px-3 py-2.5 text-sm font-medium text-zinc-700 truncate">{asset.faNumber || "-"}</td>
                                                <td className="px-3 py-2.5 text-sm text-zinc-600 truncate">{asset.serialNumber || "-"}</td>
                                                <td className="px-3 py-2.5 text-sm text-zinc-600 truncate">
                                                    <span className="text-xs">{asset.productCategory || "-"}</span>
                                                    {asset.subCategory && <span className="text-[10px] text-zinc-400 block">{asset.subCategory}</span>}
                                                </td>
                                                <td className="px-3 py-2.5 text-sm text-zinc-600 truncate">{asset.productName || asset.brand && asset.model ? `${asset.brand} ${asset.model}` : "-"}</td>
                                                <td className="px-3 py-2.5 text-sm text-zinc-600 truncate">{asset.manufacturer || "-"}</td>
                                                <td className="px-3 py-2.5 text-sm text-zinc-600 truncate">{asset.site || "-"}</td>
                                                <td className="px-3 py-2.5 text-sm text-zinc-600 truncate">{asset.ownerFullname || "-"}</td>
                                                <td className="px-3 py-2.5">{statusBadge(asset.status)}</td>
                                                <td className="px-3 py-2.5 text-[11px] text-zinc-500 whitespace-nowrap">{formatDate(asset.warrantyExpDate)}</td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <Link
                                                        to={`/assets/${asset._id}`}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-all whitespace-nowrap"
                                                    >
                                                        Detail <ExternalLink className="w-3 h-3" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400">
                            Page {page} of {totalPages} ({total} total)
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-zinc-600 font-medium px-2">{page} / {totalPages}</span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
