import React, { useEffect, useState } from "react";
import axios from "axios";
import PerformanceChart from "@/components/PerformanceChart";
import Sidebar from "@/components/Sidebar";

export default function Analytics() {
  const [data, setData] = useState([]);

  const fetchPerformance = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/performance/summary`);
      setData([
        { name: "CPU", value: res.data.avgCpu },
        { name: "RAM", value: res.data.avgRam },
        { name: "Disk", value: res.data.avgDisk },
      ]);
    } catch (err) {
      console.error("Gagal fetch performance:", err);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 bg-zinc-100 p-6 overflow-auto">
        <h2 className="text-2xl font-bold mb-4">📊 Analytics</h2>

        <PerformanceChart data={data} title="Average CPU, RAM, and Disk Usage" />
      </div>
    </div>
  );
}
