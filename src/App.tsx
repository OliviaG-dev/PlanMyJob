import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Dashboard from "./pages/Dashboard/Dashboard";
import Candidatures from "./pages/Candidatures/Candidatures";
import CandidatureDetail from "./pages/CandidatureDetail/CandidatureDetail";
import Kanban from "./pages/Kanban/Kanban";
import Planning from "./pages/Planning/Planning";
import Taches from "./pages/Taches/Taches";
import Settings from "./pages/Settings/Settings";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="candidatures" element={<Candidatures />} />
          <Route path="candidatures/:id" element={<CandidatureDetail />} />
          <Route path="kanban" element={<Kanban />} />
          <Route path="planning" element={<Planning />} />
          <Route path="taches" element={<Taches />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
