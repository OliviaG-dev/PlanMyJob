import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout/Layout";
import Loader from "./components/Loader/Loader";
import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";
import Dashboard from "./pages/Dashboard/Dashboard";
import Candidatures from "./pages/Candidatures/Candidatures";
import CandidatureDetail from "./pages/CandidatureDetail/CandidatureDetail";
import Kanban from "./pages/Kanban/Kanban";
import Planning from "./pages/Planning/Planning";
import Taches from "./pages/Taches/Taches";
import OutilsPostulations from "./pages/OutilsPostulations/OutilsPostulations";
import Settings from "./pages/Settings/Settings";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import NotFound from "./pages/NotFound/NotFound";
import "./App.css";

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) {
    return <Loader fullScreen label="Chargement…" />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Layout />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/" element={<ProtectedLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="candidatures" element={<Candidatures />} />
          <Route path="candidatures/:id" element={<CandidatureDetail />} />
          <Route path="kanban" element={<Kanban />} />
          <Route path="planning" element={<Planning />} />
          <Route path="taches" element={<Taches />} />
          <Route path="ressources" element={<OutilsPostulations />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
