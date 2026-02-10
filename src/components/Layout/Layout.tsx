import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import "./Layout.css";

function Layout() {
  return (
    <div className="layout">
      <Sidebar />
      <div className="layout__content">
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;
