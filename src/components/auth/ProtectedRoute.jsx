import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Navbar from "../layout/Navbar";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="relative z-20 flex h-dvh items-center justify-center overflow-hidden text-white">
        Carregando...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="protected-shell">
      <Navbar />
      <main className="protected-content" id="conteudo-principal" tabIndex="-1">
        {children}
      </main>
      <footer className="rodape">
        <p>&copy; {new Date().getFullYear()} Stellar Interaction. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
