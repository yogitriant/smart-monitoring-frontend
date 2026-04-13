// src/router/AppRouter.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import PrivateRoute from "./PrivateRoute";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Computers from "../pages/Computers";
import ComputerDetail from "../pages/ComputerDetail";
import Analytics from "../pages/Analytics";
import Settings from "../pages/Settings";
import SpecHistory from "../pages/SpecHistory";
import UserList from "../pages/UserList";
import Forbidden from "../pages/Forbidden";
import NotFound from "../pages/NotFound";
import LogHistory from "../pages/LogHistory";
import OpnameCreate from "@/pages/OpnameCreate";
import OpnameList from "@/pages/OpnameList";
import OpnameDetail from "@/pages/OpnameDetail";
import OpnamePublic from "@/pages/OpnamePublic";
import OpnameEdit from "@/pages/OpnameEdit";
import AgentUpdates from "@/pages/AgentUpdates";
import UpdateTimeout from "@/pages/UpdateTimeout";
import AssetList from "@/pages/AssetList";
import AssetDetail from "@/pages/AssetDetail";
import AssetCreate from "@/pages/AssetCreate";
import MasterCategory from "@/pages/MasterCategory";
import MasterLocation from "@/pages/MasterLocation";
import Scripts from "@/pages/Scripts";
import GeoMap from "@/pages/GeoMap";

export default function AppRouter() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/opname/public/:token" element={<OpnamePublic />} />
      <Route path="/update-timeout" element={<UpdateTimeout />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/computers"
        element={
          <PrivateRoute>
            <Computers />
          </PrivateRoute>
        }
      />
      <Route
        path="/computers/:id"
        element={
          <PrivateRoute>
            <ComputerDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <PrivateRoute>
            <Analytics />
          </PrivateRoute>
        }
      />
      <Route
        path="/geo-map"
        element={
          <PrivateRoute roles={["admin", "superadmin"]}>
            <GeoMap />
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        }
      />
      <Route
        path="/master-data/category"
        element={
          <PrivateRoute>
            <MasterCategory />
          </PrivateRoute>
        }
      />
      <Route
        path="/master-data/location"
        element={
          <PrivateRoute>
            <MasterLocation />
          </PrivateRoute>
        }
      />
      <Route
        path="/agent-updates"
        element={
          <PrivateRoute>
            <AgentUpdates />
          </PrivateRoute>
        }
      />
      <Route
        path="/opname/create"
        element={
          <PrivateRoute>
            <OpnameCreate />
          </PrivateRoute>
        }
      />
      <Route
        path="/opname"
        element={
          <PrivateRoute>
            <OpnameList />
          </PrivateRoute>
        }
      />
      <Route
        path="/opname/:id"
        element={
          <PrivateRoute>
            <OpnameDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/opname/edit/:id"
        element={
          <PrivateRoute>
            <OpnameEdit />
          </PrivateRoute>
        }
      />

      {/* Asset Management routes */}
      <Route
        path="/assets"
        element={
          <PrivateRoute>
            <AssetList />
          </PrivateRoute>
        }
      />
      <Route
        path="/assets/create"
        element={
          <PrivateRoute>
            <AssetCreate />
          </PrivateRoute>
        }
      />
      <Route
        path="/assets/:id"
        element={
          <PrivateRoute>
            <AssetDetail />
          </PrivateRoute>
        }
      />

      {/* Role-based routes */}
      <Route
        path="/logs"
        element={
          <PrivateRoute roles={["admin", "superadmin"]}>
            <LogHistory />
          </PrivateRoute>
        }
      />
      <Route
        path="/scripts"
        element={
          <PrivateRoute roles={["superadmin"]}>
            <Scripts />
          </PrivateRoute>
        }
      />
      {(user?.role === "admin" || user?.role === "superadmin") && (
        <Route
          path="/spec-history"
          element={
            <PrivateRoute>
              <SpecHistory />
            </PrivateRoute>
          }
        />
      )}
      <Route
        path="/users"
        element={
          <PrivateRoute roles={["superadmin"]}>
            <UserList />
          </PrivateRoute>
        }
      />


      {/* Forbidden page */}
      <Route path="/forbidden" element={<Forbidden />} />

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
