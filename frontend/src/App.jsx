import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LendersTable from "./pages/LendersTable";
import LenderProfile from "./pages/LenderProfile";
import PipelineTable from "./pages/PipelineTable";
import ProspectProfile from "./pages/ProspectProfile";
import Upload from "./pages/Upload";
import ActivityLog from "./pages/ActivityLog";
import AdminPanel from "./pages/AdminPanel";
import MyDeals from "./pages/MyDeals";
import ProspectDealView from "./pages/ProspectDealView";
import VariablesPage from "./pages/VariablesPage";
import CreateDealForm from "./components/CreateDealForm";

function HomeRedirect() {
  const role = localStorage.getItem("wbc_user_role");
  if (role === "prospect") return <Navigate to="/my-deals" replace />;
  return <Dashboard />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<HomeRedirect />} />

          <Route element={<ProtectedRoute allowedRoles={["admin", "manager"]} />}>
            <Route path="lenders" element={<LendersTable />} />
            <Route path="lenders/:id" element={<LenderProfile />} />
            <Route path="deals" element={<PipelineTable />} />
            <Route path="deals/:id" element={<ProspectProfile />} />
            <Route path="deals/:id/preview" element={<ProspectDealView previewMode />} />
            <Route path="deals/new" element={<CreateDealForm />} />
            <Route path="activity" element={<ActivityLog />} />
            <Route path="upload" element={<Upload />} />
            <Route path="variables" element={<VariablesPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="admin" element={<AdminPanel />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["prospect"]} />}>
            <Route path="my-deals" element={<MyDeals />} />
            <Route path="my-deals/:id" element={<ProspectDealView />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
