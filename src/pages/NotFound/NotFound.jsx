// src/pages/NotFound/NotFound.jsx
import { useNavigate } from "react-router-dom";
import "./NotFound.css";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <span>404</span>
        <h1>Página não encontrada</h1>
        <p>A rota saiu da órbita. Volte para a base principal.</p>
        <button onClick={() => navigate("/")} className="stellar-button">
          Voltar
        </button>
      </div>
    </div>
  );
}
