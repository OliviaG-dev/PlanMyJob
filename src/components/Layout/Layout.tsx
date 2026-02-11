import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import "./Layout.css";

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout">
      <button
        type="button"
        className="layout__menu-btn"
        aria-label="Ouvrir le menu"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="layout__menu-icon" aria-hidden>
          ☰
        </span>
      </button>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="layout__content">
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;
