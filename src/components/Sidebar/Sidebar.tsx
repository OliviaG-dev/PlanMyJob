import { NavLink } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  const links = [
    { to: "/dashboard", label: "Tableau de bord" },
    { to: "/candidatures", label: "Candidatures" },
    { to: "/kanban", label: "Kanban" },
    { to: "/planning", label: "Planning" },
    { to: "/taches", label: "Tâches" },
    { to: "/settings", label: "Paramètres" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <NavLink to="/dashboard" className="sidebar__logo">
          PlanMyJob
        </NavLink>
      </div>
      <nav className="sidebar__nav">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
