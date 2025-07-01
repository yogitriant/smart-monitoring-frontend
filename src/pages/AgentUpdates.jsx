// src/pages/AgentUpdates.jsx
import React from "react";
import Sidebar from "@/components/Sidebar";
import AgentUpdateDashboard from "@/components/ui/AgentUpdateDashboard";

export default function AgentUpdates() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 bg-zinc-100 p-6 overflow-y-auto">
        <AgentUpdateDashboard />
      </div>
    </div>
  );
}
