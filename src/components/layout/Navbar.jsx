import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import CoinsDisplay from "../user/CoinsDisplay";
import UserAvatar from "../user/UserAvatar";

const links = [
  { to: "/", label: "Início", shortLabel: "Início" },
  { to: "/planets", label: "Planetas", shortLabel: "Planetas" },
  { to: "/mysteries", label: "Mistérios", shortLabel: "Mistérios" },
  { to: "/videos", label: "Vídeos", shortLabel: "Vídeos" },
  { to: "/quiz", label: "Quiz", shortLabel: "Quiz" },
  { to: "/game", label: "Jogo", shortLabel: "Jogo" },
  { to: "/store", label: "Loja", shortLabel: "Loja" },
  { to: "/feedback", label: "Feedback", shortLabel: "Contato" },
  { to: "/profile", label: "Perfil", shortLabel: "Perfil" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open]);

  const linkClass = ({ isActive }) =>
    `nav-link ${isActive ? "is-active" : ""}`;

  return (
    <>
      <a className="skip-link" href="#conteudo-principal">
        Ir para o conteúdo
      </a>

      <header className="menu-topo">
        <NavLink className="nav-brand" to="/" aria-label="Stellar Interaction - início">
          <span className="nav-brand-mark" aria-hidden="true" />
          <span>
            <strong>Stellar Interaction</strong>
            <small>Cosmic Command</small>
          </span>
        </NavLink>

        <nav className="menu-links" aria-label="Navegação principal">
          {links.map((link) => (
            <NavLink key={link.to} className={linkClass} to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="menu-actions">
          <CoinsDisplay />
          <button
            className="menu-toggle"
            type="button"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            aria-controls="menu-mobile"
            onClick={() => setOpen((current) => !current)}
          >
            <span className="menu-toggle-icon" aria-hidden="true" />
          </button>
        </div>
      </header>

      <UserAvatar />

      {open && (
        <div className="mobile-menu-backdrop" onClick={() => setOpen(false)}>
          <aside
            className="mobile-menu-panel"
            id="menu-mobile"
            aria-label="Menu mobile"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mobile-menu-header">
              <div>
                <strong>Stellar Interaction</strong>
                <span>Navegação da missão</span>
              </div>
              <button
                className="mobile-menu-close"
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
              >
                X
              </button>
            </div>

            <nav className="mobile-menu-links" aria-label="Navegação mobile">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  onClick={() => setOpen(false)}
                  className={linkClass}
                  to={link.to}
                >
                  {link.shortLabel}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
