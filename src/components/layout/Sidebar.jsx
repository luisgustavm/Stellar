import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg transition ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-white/70 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-56 bg-black/40 border-r border-white/10 p-4 text-white gap-2">
      
      <h2 className="font-bold mb-4 text-lg">Menu</h2>

      <NavLink to="/" className={linkClass}>Início</NavLink>
      <NavLink to="/planets" className={linkClass}>Planetas</NavLink>
      <NavLink to="/quiz" className={linkClass}>Quiz</NavLink>
      <NavLink to="/store" className={linkClass}>Loja</NavLink>
      <NavLink to="/game" className={linkClass}>Jogo</NavLink>
      <NavLink to="/videos" className={linkClass}>Vídeos</NavLink>
      <NavLink to="/mysteries" className={linkClass}>Mistérios</NavLink>
      <NavLink to="/feedback" className={linkClass}>Feedback</NavLink>

    </aside>
  );
}