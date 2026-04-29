import React, { useEffect, useState, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "@/lib/axios";
import {
    ArrowLeft, Save, Trash2, Plus, X, Monitor, ExternalLink,
    Package, MapPin, Calendar, User, Wrench, FileText, History,
    Paperclip, Download, UploadCloud, Loader2
} from "lucide-react";
import AutocompleteInput from "@/components/AutocompleteInput";

const STATUS_OPTIONS = ["Deployed", "Reserve", "Received", "On Loan", "Down", "Inventory", "Disposed"];
const STATUS_REASON_OPTIONS = ["-", "Hibah", "Lelang", "Obsolete"];

export default function AssetDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [asset, setAsset] = useState(null);
    const [form, setForm] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [toast, setToast] = useState(null);
    const [specHistory, setSpecHistory] = useState([]);
    const [locations, setLocations] = useState([]);
    const [fieldOptions, setFieldOptions] = useState([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const res = await axios.get(`/api/assets/${id}`);
                setAsset(res.data);
                setForm({
                    ...res.data,
                    location: res.data.location?._id || res.data.location || "",
                    receiveDate: res.data.receiveDate?.slice(0, 10) || "",
                    loanStartDate: res.data.loanStartDate?.slice(0, 10) || "",
                    loanEndDate: res.data.loanEndDate?.slice(0, 10) || "",
                    downTime: res.data.downTime?.slice(0, 10) || "",
                    disposalDate: res.data.disposalDate?.slice(0, 10) || "",
                    warrantyExpDate: res.data.warrantyExpDate?.slice(0, 10) || "",
                    customSpecs: res.data.customSpecs || [],
                    attachments: res.data.attachments || [],
                });

                // Fetch locations + field options
                try {
                    const [locRes, foRes] = await Promise.all([
                        axios.get(`/api/location`),
                        axios.get(`/api/field-options`),
                    ]);
                    setLocations(locRes.data);
                    setFieldOptions(foRes.data);
                } catch { /* optional */ }
            } catch (err) {
                console.error("❌ Gagal ambil asset:", err);
                showToast("Gagal memuat data asset", "error");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    // Fetch spec change history if PC is linked
    useEffect(() => {
        if (!asset?.pc?._id) return;
        (async () => {
            try {
                const res = await axios.get(`/api/spec-history`);
                const pcId = asset.pc._id;
                const filtered = res.data.filter((h) => {
                    const hPcId = h.pc?._id || h.pc;
                    return hPcId === pcId;
                });
                setSpecHistory(filtered);
            } catch (err) {
                console.log("Spec history not available:", err.message);
            }
        })();
    }, [asset]);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const getOptionsList = (type) => {
        return fieldOptions.filter(o => o.type === type).map(o => o.value);
    };

    // Dependent options: Sub Category filtered by selected Product Category
    const subCategoryOptions = useMemo(() => {
        if (!form.productCategory) return [];
        return fieldOptions.filter(o => o.type === "subCategory" && o.parent === form.productCategory);
    }, [fieldOptions, form.productCategory]);

    // Dependent options: Site filtered by selected Site Group
    const siteOptions = useMemo(() => {
        if (!form.siteGroup) return [];
        return fieldOptions.filter(o => o.type === "site" && o.parent === form.siteGroup);
    }, [fieldOptions, form.siteGroup]);

    const handleChangeWithReset = (field, value) => {
        setForm(prev => {
            const next = { ...prev, [field]: value };
            if (field === "productCategory") next.subCategory = "";
            if (field === "siteGroup") next.site = "";
            return next;
        });
    };

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const addSpec = () => {
        setForm((prev) => ({
            ...prev,
            customSpecs: [...(prev.customSpecs || []), { key: "", value: "" }],
        }));
    };

    const removeSpec = (index) => {
        setForm((prev) => ({
            ...prev,
            customSpecs: prev.customSpecs.filter((_, i) => i !== index),
        }));
    };

    const updateSpec = (index, field, value) => {
        setForm((prev) => ({
            ...prev,
            customSpecs: prev.customSpecs.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const payload = { ...form };
            // Remove populated pc object, send only id
            if (payload.pc && typeof payload.pc === "object") payload.pc = payload.pc._id;
            // Remove populated location object, send only id
            if (payload.location && typeof payload.location === "object") payload.location = payload.location._id;
            // Set to null if empty string to avoid Mongoose CastError
            if (payload.location === "") payload.location = null;
            // Remove mongoose fields
            delete payload._id;
            delete payload.__v;
            delete payload.createdAt;
            delete payload.updatedAt;
            // Clean empty dates
            ["receiveDate", "loanStartDate", "loanEndDate", "downTime", "disposalDate", "warrantyExpDate"].forEach((f) => {
                if (!payload[f]) payload[f] = null;
            });

            await axios.put(`/api/assets/${id}`, payload);
            showToast("Asset berhasil disimpan!");
        } catch (err) {
            console.error("❌ Gagal simpan:", err);
            showToast(err.response?.data?.message || "Gagal menyimpan asset", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            await axios.delete(`/api/assets/${id}`);
            navigate("/assets");
        } catch (err) {
            console.error("❌ Gagal hapus:", err);
            showToast("Gagal menghapus asset", "error");
            setDeleting(false);
        }
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Basic frontend validation
        const validTypes = ["application/pdf", "image/jpeg", "image/png"];
        const invalidFile = files.find(f => !validTypes.includes(f.type));
        if (invalidFile) {
            return showToast("Hanya file PDF, JPG, dan PNG yang diizinkan", "error");
        }

        const largeFile = files.find(f => f.size > 5 * 1024 * 1024);
        if (largeFile) {
            return showToast("Ukuran file maksimal 5MB", "error");
        }

        try {
            setUploading(true);
            const formData = new FormData();
            files.forEach(file => formData.append("files", file));

            const res = await axios.post(`/api/assets/${id}/attachments`, formData);

            setForm(prev => ({ ...prev, attachments: res.data }));
            showToast("Dokumen berhasil diupload");
        } catch (err) {
            console.error("❌ Gagal upload:", err);
            const errMsg = err.response?.data?.message || err.response?.statusText || err.message || "Gagal mengupload dokumen";
            showToast(`Error: ${errMsg}`, "error");
        } finally {
            setUploading(false);
            e.target.value = null; // reset input
        }
    };

    const handleDeleteAttachment = async (attachmentId) => {
        if (!window.confirm("Hapus dokumen ini?")) return;
        try {
            const res = await axios.delete(`/api/assets/${id}/attachments/${attachmentId}`);
            setForm(prev => ({ ...prev, attachments: res.data.attachments }));
            showToast("Dokumen dihapus");
        } catch (err) {
            console.error("❌ Gagal hapus attachment:", err);
            showToast("Gagal menghapus dokumen", "error");
        }
    };

    const inputClass = "w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all";
    const labelClass = "block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1";
    const sectionClass = "bg-white border border-zinc-200/60 rounded-2xl shadow-sm p-5 space-y-4";

    if (loading) {
        return (
            <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <div className="flex-1 bg-slate-50 flex items-center justify-center">
                    <div className="text-sm text-zinc-400 animate-pulse">Loading asset...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 bg-slate-50 overflow-y-auto">
                {/* Toast */}
                {toast && (
                    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all ${toast.type === "error" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"}`}>
                        {toast.msg}
                    </div>
                )}

                {/* Header */}
                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200/60 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate("/assets")} className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors">
                                <ArrowLeft className="w-4 h-4 text-zinc-600" />
                            </button>
                            <div>
                                <h2 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-primary-600" />
                                    {form.productName || form.faNumber || "Asset Detail"}
                                </h2>
                                <p className="text-xs text-zinc-400">{form.faNumber || "No FA Number"} • {form.serialNumber || "No SN"}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50">
                                <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-5 max-w-5xl">
                    {/* PC Link */}
                    {asset?.pc && (
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
                            <Monitor className="w-4 h-4" />
                            <span>Linked to PC: <strong>{asset.pc.pcId}</strong> ({asset.pc.status || "offline"})</span>
                            <Link to={`/computers/${asset.pc._id}`} className="ml-auto flex items-center gap-1 text-xs font-medium hover:underline">
                                View Monitoring <ExternalLink className="w-3 h-3" />
                            </Link>
                        </div>
                    )}

                    {/* CI / FA Information */}
                    <div className={sectionClass}>
                        <h3 className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary-500" /> CI / FA Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className={labelClass}>FA Number</label>
                                <input value={form.faNumber || ""} onChange={(e) => handleChange("faNumber", e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Serial Number</label>
                                <input value={form.serialNumber || ""} onChange={(e) => handleChange("serialNumber", e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Company</label>
                                <input value={form.company || ""} onChange={(e) => handleChange("company", e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Status</label>
                                <select value={form.status || ""} onChange={(e) => handleChange("status", e.target.value)} className={inputClass}>
                                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Status Reason</label>
                                <select value={form.statusReason || "-"} onChange={(e) => handleChange("statusReason", e.target.value)} className={inputClass}>
                                    {STATUS_REASON_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Field Categorization */}
                    <div className={sectionClass}>
                        <h3 className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                            <Wrench className="w-4 h-4 text-primary-500" /> Field Categorization
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className={labelClass}>Product Category</label>
                                <AutocompleteInput
                                    value={form.productCategory || ""}
                                    onChange={(v) => handleChangeWithReset("productCategory", v)}
                                    options={getOptionsList("productCategory")}
                                    placeholder="- Pilih Category -"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Sub Category</label>
                                <AutocompleteInput
                                    value={form.subCategory || ""}
                                    onChange={(v) => handleChange("subCategory", v)}
                                    options={subCategoryOptions.map(o => o.value)}
                                    disabled={!form.productCategory}
                                    placeholder={form.productCategory ? "- Pilih Sub Category -" : "-"}
                                />
                                {!form.productCategory && <p className="text-[10px] text-amber-500 mt-0.5">Pilih Product Category dulu</p>}
                            </div>
                            <div>
                                <label className={labelClass}>Product Name</label>
                                <AutocompleteInput
                                    value={form.productName || ""}
                                    onChange={(v) => handleChange("productName", v)}
                                    options={getOptionsList("productName")}
                                    placeholder="- Pilih Product -"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Manufacturer</label>
                                <AutocompleteInput
                                    value={form.manufacturer || ""}
                                    onChange={(v) => handleChange("manufacturer", v)}
                                    options={getOptionsList("manufacturer")}
                                    placeholder="- Pilih Manufacturer -"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Supplier Name</label>
                                <AutocompleteInput
                                    value={form.supplierName || ""}
                                    onChange={(v) => handleChange("supplierName", v)}
                                    options={getOptionsList("supplierName")}
                                    placeholder="- Pilih Supplier -"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className={sectionClass}>
                        <h3 className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary-500" /> Location
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <label className={labelClass}>Lokasi (Room)</label>
                                <AutocompleteInput
                                    value={form.location || ""}
                                    onChange={(v) => handleChange("location", v)}
                                    options={locations.map(loc => ({ label: `${loc.room} (${loc.category})`, value: loc._id }))}
                                    placeholder="- Pilih Lokasi -"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Region</label>
                                <AutocompleteInput
                                    value={form.region || ""}
                                    onChange={(v) => handleChange("region", v)}
                                    options={getOptionsList("region")}
                                    placeholder="- Pilih Region -"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Site Group</label>
                                <AutocompleteInput
                                    value={form.siteGroup || ""}
                                    onChange={(v) => handleChangeWithReset("siteGroup", v)}
                                    options={getOptionsList("siteGroup")}
                                    placeholder="- Pilih Site Group -"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Site</label>
                                <AutocompleteInput
                                    value={form.site || ""}
                                    onChange={(v) => handleChange("site", v)}
                                    options={siteOptions.map(o => o.value)}
                                    disabled={!form.siteGroup}
                                    placeholder={form.siteGroup ? "- Pilih Site -" : "-"}
                                />
                                {!form.siteGroup && <p className="text-[10px] text-amber-500 mt-0.5">Pilih Site Group dulu</p>}
                            </div>
                            <div>
                                <label className={labelClass}>Division</label>
                                <AutocompleteInput
                                    value={form.division || ""}
                                    onChange={(v) => handleChange("division", v)}
                                    options={getOptionsList("division")}
                                    placeholder="- Pilih Division -"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Department</label>
                                <AutocompleteInput
                                    value={form.department || ""}
                                    onChange={(v) => handleChange("department", v)}
                                    options={getOptionsList("department")}
                                    placeholder="- Pilih Department -"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Owner Site</label>
                                <AutocompleteInput
                                    value={form.ownerSite || ""}
                                    onChange={(v) => handleChange("ownerSite", v)}
                                    options={getOptionsList("ownerSite")}
                                    placeholder="- Pilih Owner Site -"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Lifecycle */}
                    <div className={sectionClass}>
                        <h3 className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary-500" /> Lifecycle
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { label: "Receive Date", field: "receiveDate" },
                                { label: "Loan Start Date", field: "loanStartDate" },
                                { label: "Loan End Date", field: "loanEndDate" },
                                { label: "Down Time", field: "downTime" },
                                { label: "Disposal Date", field: "disposalDate" },
                                { label: "Warranty Exp. Date", field: "warrantyExpDate" },
                            ].map(({ label, field }) => (
                                <div key={field}>
                                    <label className={labelClass}>{label}</label>
                                    <input type="date" value={form[field] || ""} onChange={(e) => handleChange(field, e.target.value)} className={inputClass} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Owner Information */}
                    <div className={sectionClass}>
                        <h3 className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                            <User className="w-4 h-4 text-primary-500" /> Owner Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Owner Fullname</label>
                                <input value={form.ownerFullname || ""} onChange={(e) => handleChange("ownerFullname", e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Job Designation</label>
                                <input value={form.jobDesignation || ""} onChange={(e) => handleChange("jobDesignation", e.target.value)} className={inputClass} placeholder="e.g. IT Asset Management" />
                            </div>
                        </div>
                    </div>

                    {/* Specs */}
                    <div className={sectionClass}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                                <Wrench className="w-4 h-4 text-primary-500" /> Specifications
                            </h3>
                            <button onClick={addSpec} className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors">
                                <Plus className="w-3 h-3" /> Add Spec
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Brand</label>
                                <input value={form.brand || ""} onChange={(e) => handleChange("brand", e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Model</label>
                                <input value={form.model || ""} onChange={(e) => handleChange("model", e.target.value)} className={inputClass} />
                            </div>
                        </div>
                        {form.customSpecs?.length > 0 && (
                            <div className="space-y-2 mt-2">
                                <label className={labelClass}>Custom Specifications</label>
                                {form.customSpecs.map((spec, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <input
                                            value={spec.key}
                                            onChange={(e) => updateSpec(i, "key", e.target.value)}
                                            placeholder="Key (e.g. RAM)"
                                            className={`${inputClass} flex-1`}
                                        />
                                        <input
                                            value={spec.value}
                                            onChange={(e) => updateSpec(i, "value", e.target.value)}
                                            placeholder="Value (e.g. 16 GB)"
                                            className={`${inputClass} flex-1`}
                                        />
                                        <button onClick={() => removeSpec(i)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Attachments */}
                    <div className={sectionClass}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                                <Paperclip className="w-4 h-4 text-primary-500" /> Attachments
                            </h3>
                            <div>
                                <input
                                    type="file"
                                    id="fileUpload"
                                    multiple
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                />
                                <label
                                    htmlFor="fileUpload"
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                                        uploading
                                            ? "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed"
                                            : "text-primary-600 border-primary-200 hover:bg-primary-50"
                                    }`}
                                >
                                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                                    Upload Document
                                </label>
                            </div>
                        </div>

                        {form.attachments?.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                {form.attachments.map((file) => (
                                    <div key={file._id} className="flex items-center justify-between p-3 border border-zinc-200/80 rounded-xl bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-white rounded-lg shadow-sm border border-zinc-100">
                                                <FileText className="w-4 h-4 text-primary-500" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-medium text-zinc-700 truncate" title={file.originalName}>
                                                    {file.originalName}
                                                </p>
                                                <p className="text-[10px] text-zinc-400">
                                                    {(file.size / 1024).toFixed(1)} KB • {new Date(file.uploadedAt).toLocaleDateString("id-ID")}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0 ml-2">
                                            <a
                                                href={`${import.meta.env.VITE_API_BASE_URL || ""}${file.url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 text-zinc-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                title="Download/View"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                            <button
                                                onClick={() => handleDeleteAttachment(file._id)}
                                                className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Document"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-zinc-200/80 rounded-xl bg-zinc-50/50">
                                <Paperclip className="w-6 h-6 text-zinc-300 mb-2" />
                                <p className="text-sm font-medium text-zinc-500">Belum ada dokumen</p>
                                <p className="text-xs text-zinc-400 mt-0.5">Upload file PDF, JPG, atau PNG (Max 5MB)</p>
                            </div>
                        )}
                    </div>

                    {/* Spec Change History */}
                    {asset?.pc && specHistory.length > 0 && (
                        <div className={sectionClass}>
                            <h3 className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                                <History className="w-4 h-4 text-primary-500" /> Spec Change History
                            </h3>
                            <div className="space-y-3">
                                {specHistory.map((h, i) => {
                                    const old = h.oldSpec || {};
                                    const nw = h.newSpec || {};
                                    const fields = ["cpu", "ram", "gpu", "os", "brand", "model"];
                                    const changes = fields.filter((f) => (old[f] || "-") !== (nw[f] || "-"));
                                    const statusBadge = h.approved
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : h.rejected
                                            ? "bg-red-50 text-red-700 border-red-200"
                                            : "bg-amber-50 text-amber-700 border-amber-200";
                                    const statusText = h.approved ? "Approved" : h.rejected ? "Rejected" : "Pending";

                                    return (
                                        <div key={h._id || i} className="border border-zinc-100 rounded-xl px-4 py-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs text-zinc-400">
                                                    {new Date(h.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                                                </span>
                                                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${statusBadge}`}>
                                                    {statusText}
                                                </span>
                                            </div>
                                            {changes.length > 0 ? (
                                                <div className="space-y-1">
                                                    {changes.map((f) => (
                                                        <div key={f} className="text-xs">
                                                            <span className="font-semibold text-zinc-600 uppercase">{f}</span>:{" "}
                                                            <span className="text-red-500 line-through">{old[f] || "-"}</span>{" → "}
                                                            <span className="text-emerald-600 font-medium">{nw[f] || "-"}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-zinc-400">Disk or other changes</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl p-6 w-96 space-y-4">
                            <h3 className="text-lg font-bold text-zinc-800">Hapus Asset?</h3>
                            <p className="text-sm text-zinc-500">
                                Asset <strong>{form.faNumber || form.productName || "ini"}</strong> akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
                            </p>
                            <div className="flex items-center gap-2 justify-end">
                                <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-1.5 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors">
                                    Batal
                                </button>
                                <button onClick={handleDelete} disabled={deleting} className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50">
                                    {deleting ? "Menghapus..." : "Hapus"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
