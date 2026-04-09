import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import axios from "@/lib/axios";
import { Plus, Edit2, Trash2, X, Check, Database } from "lucide-react";

const OPTION_TYPES = [
    { value: "productCategory", label: "Product Category" },
    { value: "subCategory", label: "Sub Category" },
    { value: "productName", label: "Product Name" },
    { value: "manufacturer", label: "Manufacturer" },
    { value: "supplierName", label: "Supplier Name" },
    { value: "region", label: "Region" },
    { value: "siteGroup", label: "Site Group" },
    { value: "site", label: "Site" },
    { value: "division", label: "Division" },
    { value: "department", label: "Department" },
    { value: "ownerSite", label: "Owner Site" },
];

export default function MasterData() {
    const [activeTab, setActiveTab] = useState("locations");
    const [toast, setToast] = useState(null);

    // Locations State
    const [locations, setLocations] = useState([]);
    const [locLoading, setLocLoading] = useState(false);
    const [locForm, setLocForm] = useState(null);

    // Field Options State
    const [fieldOptions, setFieldOptions] = useState([]);
    const [foLoading, setFoLoading] = useState(false);
    const [foForm, setFoForm] = useState(null);
    const [foFilter, setFoFilter] = useState("productCategory");

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        if (activeTab === "locations") fetchLocations();
        else fetchFieldOptions();
    }, [activeTab, foFilter]);

    // --- Locations ---
    const fetchLocations = async () => {
        try {
            setLocLoading(true);
            const res = await axios.get("/api/location");
            setLocations(res.data);
        } catch (err) {
            showToast("Gagal mengambil data lokasi", "error");
        } finally {
            setLocLoading(false);
        }
    };

    const handleSaveLocation = async () => {
        try {
            if (locForm._id) {
                await axios.put(`/api/location/${locForm._id}`, locForm);
                showToast("Lokasi berhasil diperbarui");
            } else {
                await axios.post("/api/location", locForm);
                showToast("Lokasi berhasil ditambahkan");
            }
            setLocForm(null);
            fetchLocations();
        } catch (err) {
            showToast("Gagal menyimpan lokasi", "error");
        }
    };

    const handleDeleteLocation = async (id) => {
        if (!confirm("Hapus lokasi ini?")) return;
        try {
            await axios.delete(`/api/location/${id}`);
            showToast("Lokasi berhasil dihapus");
            fetchLocations();
        } catch (err) {
            showToast("Gagal menghapus lokasi", "error");
        }
    };

    // --- Field Options ---
    const fetchFieldOptions = async () => {
        try {
            setFoLoading(true);
            const res = await axios.get(`/api/field-options?type=${foFilter}`);
            setFieldOptions(res.data);
        } catch (err) {
            showToast("Gagal mengambil data opsi field", "error");
        } finally {
            setFoLoading(false);
        }
    };

    const handleSaveFieldOption = async () => {
        try {
            if (foForm._id) {
                await axios.put(`/api/field-options/${foForm._id}`, foForm);
                showToast("Opsi field diperbarui");
            } else {
                await axios.post("/api/field-options", { ...foForm, type: foFilter });
                showToast("Opsi field ditambahkan");
            }
            setFoForm(null);
            fetchFieldOptions();
        } catch (err) {
            showToast("Gagal menyimpan opsi field", "error");
        }
    };

    const handleDeleteFieldOption = async (id) => {
        if (!confirm("Hapus opsi field ini?")) return;
        try {
            await axios.delete(`/api/field-options/${id}`);
            showToast("Opsi field dihapus");
            fetchFieldOptions();
        } catch (err) {
            showToast("Gagal menghapus opsi field", "error");
        }
    };

    const btnClass = "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5";
    const inputClass = "w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all";

    return (
        <div className="flex bg-slate-50 h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 overflow-y-auto w-full">
                {toast && (
                    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all ${toast.type === "error" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"}`}>
                        {toast.msg}
                    </div>
                )}

                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200/60 px-6 py-4">
                    <h2 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
                        <Database className="w-5 h-5 text-primary-600" /> Master Data
                    </h2>
                    <p className="text-xs text-zinc-400">Manage lookup tables for the application</p>
                </div>

                <div className="p-6 max-w-6xl mx-auto space-y-6">
                    <div className="flex space-x-1 border-b border-zinc-200">
                        {["locations", "fieldOptions"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-primary-500 text-primary-600" : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"}`}
                            >
                                {tab === "locations" ? "Locations" : "Field Categorizations & Dropdowns"}
                            </button>
                        ))}
                    </div>

                    {/* Locations Tab */}
                    {activeTab === "locations" && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-zinc-700">Locations List</h3>
                                <button onClick={() => setLocForm({ category: "Unassigned", floor: "", room: "" })} className={`${btnClass} bg-primary-600 text-white hover:bg-primary-700`}>
                                    <Plus className="w-4 h-4" /> Add Location
                                </button>
                            </div>

                            {locLoading ? (
                                <p className="text-sm text-zinc-400">Loading...</p>
                            ) : (
                                <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                                    <table className="w-full text-left text-sm text-zinc-600">
                                        <thead className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase text-zinc-500">
                                            <tr>
                                                <th className="px-4 py-3">Room</th>
                                                <th className="px-4 py-3">Floor</th>
                                                <th className="px-4 py-3">Category</th>
                                                <th className="px-4 py-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100">
                                            {locations.map((loc) => (
                                                <tr key={loc._id} className="hover:bg-zinc-50 w-full">
                                                    {locForm?._id === loc._id ? (
                                                        <td colSpan={5} className="p-3">
                                                            <div className="flex items-center gap-2">
                                                                <input value={locForm.room} onChange={e => setLocForm({ ...locForm, room: e.target.value })} className={inputClass} placeholder="Room" />
                                                                <input value={locForm.floor} onChange={e => setLocForm({ ...locForm, floor: e.target.value })} className={inputClass} placeholder="Floor" />
                                                                <input value={locForm.category} onChange={e => setLocForm({ ...locForm, category: e.target.value })} className={inputClass} placeholder="Category" />
                                                                <button onClick={handleSaveLocation} className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200"><Check className="w-4 h-4" /></button>
                                                                <button onClick={() => setLocForm(null)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><X className="w-4 h-4" /></button>
                                                            </div>
                                                        </td>
                                                    ) : (
                                                        <>
                                                            <td className="px-4 py-3">{loc.room}</td>
                                                            <td className="px-4 py-3">{loc.floor}</td>
                                                            <td className="px-4 py-3">{loc.category}</td>
                                                            <td className="px-4 py-3 text-right flex justify-end gap-2">
                                                                <button onClick={() => setLocForm(loc)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                                                <button onClick={() => handleDeleteLocation(loc._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                            {locForm && !locForm._id && (
                                                <tr className="bg-blue-50/50">
                                                    <td colSpan={5} className="p-3">
                                                        <div className="flex items-center gap-2">
                                                            <input value={locForm.room} onChange={e => setLocForm({ ...locForm, room: e.target.value })} className={inputClass} placeholder="Room" />
                                                            <input value={locForm.floor} onChange={e => setLocForm({ ...locForm, floor: e.target.value })} className={inputClass} placeholder="Floor" />
                                                            <input value={locForm.category} onChange={e => setLocForm({ ...locForm, category: e.target.value })} className={inputClass} placeholder="Category" />
                                                            <button onClick={handleSaveLocation} className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200"><Check className="w-4 h-4" /></button>
                                                            <button onClick={() => setLocForm(null)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><X className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                            {locations.length === 0 && !locForm && (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-zinc-400">Belum ada data lokasi</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Field Options Tab */}
                    {activeTab === "fieldOptions" && (
                        <div className="space-y-4 flex flex-col items-start w-full">
                            <div className="flex gap-4 w-full">
                                <div className="w-64 flex-shrink-0 space-y-2 border-r border-zinc-200 pr-4">
                                    <h3 className="font-semibold text-zinc-700 mb-4">Option Type</h3>
                                    {OPTION_TYPES.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => { setFoFilter(opt.value); setFoForm(null); }}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${foFilter === opt.value ? "bg-primary-50 text-primary-700 font-medium" : "text-zinc-600 hover:bg-zinc-100"}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-semibold text-zinc-700">Options for: <span className="text-primary-600">{OPTION_TYPES.find(o => o.value === foFilter)?.label}</span></h3>
                                        <button onClick={() => setFoForm({ value: "" })} className={`${btnClass} bg-primary-600 text-white hover:bg-primary-700`}>
                                            <Plus className="w-4 h-4" /> Add Option
                                        </button>
                                    </div>

                                    {foLoading ? (
                                        <p className="text-sm text-zinc-400">Loading...</p>
                                    ) : (
                                        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                                            <table className="w-full text-left text-sm text-zinc-600">
                                                <thead className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase text-zinc-500">
                                                    <tr>
                                                        <th className="px-4 py-3">Value</th>
                                                        <th className="px-4 py-3 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-100">
                                                    {fieldOptions.map((fo) => (
                                                        <tr key={fo._id} className="hover:bg-zinc-50">
                                                            {foForm?._id === fo._id ? (
                                                                <td colSpan={2} className="p-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <input value={foForm.value} onChange={e => setFoForm({ ...foForm, value: e.target.value })} className={inputClass} placeholder="Option Value" autoFocus />
                                                                        <button onClick={handleSaveFieldOption} className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200"><Check className="w-4 h-4" /></button>
                                                                        <button onClick={() => setFoForm(null)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><X className="w-4 h-4" /></button>
                                                                    </div>
                                                                </td>
                                                            ) : (
                                                                <>
                                                                    <td className="px-4 py-3 font-medium text-zinc-800">{fo.value}</td>
                                                                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                                                                        <button onClick={() => setFoForm(fo)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                                                        <button onClick={() => handleDeleteFieldOption(fo._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                                    </td>
                                                                </>
                                                            )}
                                                        </tr>
                                                    ))}
                                                    {foForm && !foForm._id && (
                                                        <tr className="bg-blue-50/50">
                                                            <td colSpan={2} className="p-3">
                                                                <div className="flex items-center gap-2">
                                                                    <input value={foForm.value} onChange={e => setFoForm({ ...foForm, value: e.target.value })} className={inputClass} placeholder="Option Value" autoFocus />
                                                                    <button onClick={handleSaveFieldOption} className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200"><Check className="w-4 h-4" /></button>
                                                                    <button onClick={() => setFoForm(null)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><X className="w-4 h-4" /></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {fieldOptions.length === 0 && !foForm && (
                                                        <tr>
                                                            <td colSpan={2} className="px-4 py-6 text-center text-sm text-zinc-400">Belum ada data opsi untuk tipe ini</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
