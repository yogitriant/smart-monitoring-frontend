import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import { useNavigate } from "react-router-dom";
import axios from "@/lib/axios";
import {
    ArrowLeft, Save, Plus, X,
    Package, MapPin, Calendar, User, Wrench, FileText,
    Paperclip, UploadCloud
} from "lucide-react";
import AutocompleteInput from "@/components/AutocompleteInput";

const STATUS_OPTIONS = ["Deployed", "Reserve", "Received", "On Loan", "Down", "Inventory", "Disposed"];
const STATUS_REASON_OPTIONS = ["-", "Hibah", "Lelang", "Obsolete"];

const INITIAL_FORM = {
    faNumber: "", serialNumber: "", company: "",
    status: "Reserve", statusReason: "-",
    productCategory: "Hardware", subCategory: "", productName: "",
    manufacturer: "", supplierName: "",
    region: "", siteGroup: "", site: "", division: "", department: "", ownerSite: "",
    receiveDate: "", loanStartDate: "", loanEndDate: "",
    downTime: "", disposalDate: "", warrantyExpDate: "",
    ownerFullname: "", jobDesignation: "",
    brand: "", model: "",
    customSpecs: [],
};

export default function AssetCreate() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ ...INITIAL_FORM });
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [fieldOptions, setFieldOptions] = useState([]);
    const [filesToUpload, setFilesToUpload] = useState([]);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const res = await axios.get("/api/field-options");
                setFieldOptions(res.data);
            } catch (err) {
                console.error("Gagal get field options:", err);
            }
        };
        fetchOptions();
    }, []);

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


    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const addSpec = () => {
        setForm((prev) => ({
            ...prev,
            customSpecs: [...prev.customSpecs, { key: "", value: "" }],
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

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const validTypes = ["application/pdf", "image/jpeg", "image/png"];
        const validFiles = [];
        
        for (const file of files) {
            if (!validTypes.includes(file.type)) {
                showToast("Hanya file PDF, JPG, dan PNG yang diizinkan", "error");
                continue;
            }
            if (file.size > 5 * 1024 * 1024) {
                showToast("Ukuran file maksimal 5MB", "error");
                continue;
            }
            validFiles.push(file);
        }

        setFilesToUpload(prev => [...prev, ...validFiles]);
        e.target.value = null; // reset
    };

    const removeFile = (index) => {
        setFilesToUpload(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        try {
            setSaving(true);
            const payload = { ...form };
            // Clean empty dates
            ["receiveDate", "loanStartDate", "loanEndDate", "downTime", "disposalDate", "warrantyExpDate"].forEach((f) => {
                if (!payload[f]) delete payload[f];
            });
            // Clean empty strings
            Object.keys(payload).forEach((k) => {
                if (payload[k] === "" && k !== "statusReason") delete payload[k];
            });
            // Filter out empty custom specs
            payload.customSpecs = (payload.customSpecs || []).filter((s) => s.key && s.value);

            const res = await axios.post("/api/assets", payload);

            // Jika ada file yang dipilih, upload file ke endpoint attachment
            if (filesToUpload.length > 0) {
                try {
                    const formData = new FormData();
                    filesToUpload.forEach(file => formData.append("files", file));
                    await axios.post(`/api/assets/${res.data._id}/attachments`, formData);
                } catch (uploadErr) {
                    console.error("Gagal upload attachment:", uploadErr);
                    showToast("Asset berhasil dibuat tapi gagal mengupload sebagian file.", "error");
                    // Wait a bit before navigating so user can see the toast
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }

            navigate(`/assets/${res.data._id}`);
        } catch (err) {
            console.error("❌ Gagal buat asset:", err);
            showToast(err.response?.data?.message || "Gagal membuat asset", "error");
        } finally {
            setSaving(false);
        }
    };

    const inputClass = "w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all";
    const labelClass = "block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1";
    const sectionClass = "bg-white border border-zinc-200/60 rounded-2xl shadow-sm p-5 space-y-4";

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 bg-slate-50 overflow-y-auto">
                {/* Toast */}
                {toast && (
                    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg ${toast.type === "error" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"}`}>
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
                                    <Package className="w-5 h-5 text-primary-600" /> Add New Asset
                                </h2>
                                <p className="text-xs text-zinc-400">Fill in the asset information below</p>
                            </div>
                        </div>
                        <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50">
                            <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Create Asset"}
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-5 max-w-5xl">
                    {/* CI / FA Information */}
                    <div className={sectionClass}>
                        <h3 className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary-500" /> CI / FA Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className={labelClass}>FA Number</label>
                                <input value={form.faNumber} onChange={(e) => handleChange("faNumber", e.target.value)} className={inputClass} placeholder="FA-2024-001" />
                            </div>
                            <div>
                                <label className={labelClass}>Serial Number</label>
                                <input value={form.serialNumber} onChange={(e) => handleChange("serialNumber", e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Company</label>
                                <input value={form.company} onChange={(e) => handleChange("company", e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Status</label>
                                <select value={form.status} onChange={(e) => handleChange("status", e.target.value)} className={inputClass}>
                                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Status Reason</label>
                                <select value={form.statusReason} onChange={(e) => handleChange("statusReason", e.target.value)} className={inputClass}>
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
                                    value={form.productCategory}
                                    onChange={(v) => handleChangeWithReset("productCategory", v)}
                                    options={getOptionsList("productCategory")}
                                    placeholder="- Pilih Category -"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Sub Category</label>
                                <AutocompleteInput
                                    value={form.subCategory}
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
                                    value={form.productName}
                                    onChange={(v) => handleChange("productName", v)}
                                    options={getOptionsList("productName")}
                                    placeholder="- Pilih Product -"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Manufacturer</label>
                                <AutocompleteInput
                                    value={form.manufacturer}
                                    onChange={(v) => handleChange("manufacturer", v)}
                                    options={getOptionsList("manufacturer")}
                                    placeholder="- Pilih Manufacturer -"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Supplier Name</label>
                                <AutocompleteInput
                                    value={form.supplierName}
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
                            <div>
                                <label className={labelClass}>Region</label>
                                <AutocompleteInput
                                    value={form.region}
                                    onChange={(v) => handleChange("region", v)}
                                    options={getOptionsList("region")}
                                    placeholder="- Pilih Region -"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Site Group</label>
                                <AutocompleteInput
                                    value={form.siteGroup}
                                    onChange={(v) => handleChangeWithReset("siteGroup", v)}
                                    options={getOptionsList("siteGroup")}
                                    placeholder="- Pilih Site Group -"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Site</label>
                                <AutocompleteInput
                                    value={form.site}
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
                                    value={form.division}
                                    onChange={(v) => handleChange("division", v)}
                                    options={getOptionsList("division")}
                                    placeholder="- Pilih Division -"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Department</label>
                                <AutocompleteInput
                                    value={form.department}
                                    onChange={(v) => handleChange("department", v)}
                                    options={getOptionsList("department")}
                                    placeholder="- Pilih Department -"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Owner Site</label>
                                <AutocompleteInput
                                    value={form.ownerSite}
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
                                    <input type="date" value={form[field]} onChange={(e) => handleChange(field, e.target.value)} className={inputClass} />
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
                                <input value={form.ownerFullname} onChange={(e) => handleChange("ownerFullname", e.target.value)} className={inputClass} placeholder="Yoga Dewantoro" />
                            </div>
                            <div>
                                <label className={labelClass}>Job Designation</label>
                                <input value={form.jobDesignation} onChange={(e) => handleChange("jobDesignation", e.target.value)} className={inputClass} placeholder="IT Asset Management" />
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
                                <input value={form.brand} onChange={(e) => handleChange("brand", e.target.value)} className={inputClass} placeholder="Samsung, HP..." />
                            </div>
                            <div>
                                <label className={labelClass}>Model</label>
                                <input value={form.model} onChange={(e) => handleChange("model", e.target.value)} className={inputClass} />
                            </div>
                        </div>
                        {form.customSpecs.length > 0 && (
                            <div className="space-y-2 mt-2">
                                <label className={labelClass}>Custom Specifications</label>
                                {form.customSpecs.map((spec, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <input
                                            value={spec.key}
                                            onChange={(e) => updateSpec(i, "key", e.target.value)}
                                            placeholder="Key (e.g. RAM, Screen Size)"
                                            className={`${inputClass} flex-1`}
                                        />
                                        <input
                                            value={spec.value}
                                            onChange={(e) => updateSpec(i, "value", e.target.value)}
                                            placeholder="Value (e.g. 16 GB, 55 inch)"
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
                                    onChange={handleFileChange}
                                />
                                <label
                                    htmlFor="fileUpload"
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors cursor-pointer"
                                >
                                    <UploadCloud className="w-3.5 h-3.5" /> Select Documents
                                </label>
                            </div>
                        </div>

                        {filesToUpload.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                {filesToUpload.map((file, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 border border-zinc-200/80 rounded-xl bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-white rounded-lg shadow-sm border border-zinc-100">
                                                <FileText className="w-4 h-4 text-primary-500" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-medium text-zinc-700 truncate" title={file.name}>
                                                    {file.name}
                                                </p>
                                                <p className="text-[10px] text-zinc-400">
                                                    {(file.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeFile(i)}
                                            className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
                                            title="Remove File"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-zinc-200/80 rounded-xl bg-zinc-50/50">
                                <Paperclip className="w-6 h-6 text-zinc-300 mb-2" />
                                <p className="text-sm font-medium text-zinc-500">Pilih dokumen untuk diupload</p>
                                <p className="text-xs text-zinc-400 mt-0.5">Upload file PDF, JPG, atau PNG (Max 5MB)</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
