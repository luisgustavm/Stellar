import { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../services/firebase";
import { useToast } from "../../context/ToastContext";
import { getAuthErrorMessage } from "../../utils/authErrors";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function handleReset(e) {
    e.preventDefault();
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMsg("Email enviado!");
      showToast("Email de recuperação enviado.", "success");
    } catch (error) {
      setMsg("Erro ao enviar email.");
      showToast(getAuthErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-card" onSubmit={handleReset}>
      <p className="page-kicker">Recuperação</p>
      <h1>Recuperar senha</h1>
      <p>Informe seu email para receber o link de redefinição.</p>

      <input
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button className="stellar-button" type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Enviar link"}
      </button>

      {msg && <p className="auth-message">{msg}</p>}

      <Link className="auth-back-link" to="/login">
        Voltar para o login
      </Link>
    </form>
  );
}
