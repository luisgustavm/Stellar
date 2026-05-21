import { NavLink } from "react-router-dom";

export default function MobileMenu({ onClose }) {
  const linkClass = ({ isActive }) =>
    `py-2 px-2 rounded transition ${
      isActive ? "bg-blue-600" : "hover:bg-white/10"
    }`;

  return (
    <div className="md:hidden fixed inset-0 z-50 bg-black/70">

      {/* painel */}
      <div className="w-64 h-full bg-black/95 backdrop-blur border-r border-white/10 p-4 flex flex-col gap-3">

        <button
          className="text-right text-white mb-2"
          onClick={onClose}
        >
          ✕
        </button>

        <NavLink className={linkClass} onClick={onClose} to="/">
          Início
        </NavLink>

        <NavLink className={linkClass} onClick={onClose} to="/planets">
          Planetas
        </NavLink>

        <NavLink className={linkClass} onClick={onClose} to="/quiz">
          Quiz
        </NavLink>

        <NavLink className={linkClass} onClick={onClose} to="/store">
          Loja
        </NavLink>

        <NavLink className={linkClass} onClick={onClose} to="/game">
          Jogo
        </NavLink>

        <NavLink className={linkClass} onClick={onClose} to="/videos">
          Vídeos
        </NavLink>

        <NavLink className={linkClass} onClick={onClose} to="/mysteries">
          Mistérios
        </NavLink>

        <NavLink className={linkClass} onClick={onClose} to="/feedback">
          Feedback
        </NavLink>

      </div>
    </div>
  );
}