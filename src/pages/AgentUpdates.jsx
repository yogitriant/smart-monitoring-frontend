import React from "react";
import Sidebar from "@/components/Sidebar";
import AgentUpdateDashboard from "@/components/ui/AgentUpdateDashboard";

export default function AgentUpdates() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 bg-slate-50 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200/60 px-8 py-5">
          <h2 className="text-xl font-bold text-zinc-800">Agent Updates</h2>
          <p className="text-sm text-zinc-400 mt-0.5">Manage agent versions and deployments</p>
        </div>
        <div className="p-8">
          <AgentUpdateDashboard />
        </div>
      </div>
    </div>
  );
}
