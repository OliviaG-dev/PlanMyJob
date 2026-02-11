import { NavLink } from "react-router-dom";
import "./Sidebar.css";

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const links = [
    { to: "/dashboard", label: "Tableau de bord" },
    { to: "/candidatures", label: "Candidatures" },
    { to: "/kanban", label: "Kanban" },
    { to: "/planning", label: "Planning" },
    { to: "/taches", label: "Tâches" },
    { to: "/settings", label: "Paramètres" },
  ];

  return (
    <>
      {onClose && (
        <button
          type="button"
          className="sidebar__overlay"
          aria-label="Fermer le menu"
          onClick={onClose}
          style={{
            visibility: isOpen ? "visible" : "hidden",
            pointerEvents: isOpen ? "auto" : "none",
          }}
        />
      )}
      <aside
        className={`sidebar ${isOpen ? "sidebar--open" : ""}`}
        aria-hidden={onClose ? !isOpen : undefined}
      >
        <div className="sidebar__brand">
          <NavLink to="/dashboard" className="sidebar__logo" onClick={onClose}>
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
              onClick={onClose}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
