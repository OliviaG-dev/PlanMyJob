import { NavLink } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import "./Sidebar.css";

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();
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
            <img src="/logo.png" alt="" className="sidebar__logo-img" />
            <span>PlanMyJob</span>
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
        <div className="sidebar__theme">
          <button
            type="button"
            className="sidebar__theme-btn"
            onClick={toggleTheme}
            title={
              theme === "light"
                ? "Passer en thème sombre"
                : "Passer en thème clair"
            }
            aria-label={
              theme === "light"
                ? "Passer en thème sombre"
                : "Passer en thème clair"
            }
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          <button
            type="button"
            className="sidebar__signout"
            onClick={() => signOut()}
          >
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
