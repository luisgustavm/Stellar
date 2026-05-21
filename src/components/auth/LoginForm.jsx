import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getAuthErrorMessage } from "../../utils/authErrors";

function LoginForm() {
  const navigate = useNavigate();
  const { login, signInWithGoogle } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, senha);
      showToast("Login realizado com sucesso.", "success");
      navigate("/");
    } catch (err) {
      console.error(err);
      showToast(getAuthErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);

    try {
      const googleUser = await signInWithGoogle();

      if (!googleUser) {
        showToast("Redirecionando para o Google...", "info");
        return;
      }

      showToast("Você entrou com Google.", "success");
      navigate("/");
    } catch (err) {
      console.error(err);
      showToast(getAuthErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-card" aria-busy={loading}>
      <p className="page-kicker">Acesso à nave</p>
      <h1>Login</h1>
      <p>Entre na sua conta Stellar.</p>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
      />

      <button className="stellar-button" type="submit" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </button>

      {loading && (
        <p className="auth-loading-message" role="status">
          Entrando na sua conta, aguarde...
        </p>
      )}

      <button
        className="google-button"
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        <span>G</span>
        Entrar com Google
      </button>

      <div className="auth-links">
        <Link to="/forgot-password">Esqueci a senha</Link>
        <Link to="/register">Criar conta</Link>
      </div>
    </form>
  );
}

export default LoginForm;
