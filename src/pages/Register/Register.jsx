import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getAuthErrorMessage } from "../../utils/authErrors";
import "./Register.css";

export default function Register() {
  const { register, signInWithGoogle } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      await register(form.name, form.email, form.password, form.username);
      showToast("Conta criada com sucesso.", "success");
      navigate("/");
    } catch (err) {
      console.error(err);
      showToast(getAuthErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleRegister() {
    setLoading(true);

    try {
      const googleUser = await signInWithGoogle();

      if (!googleUser) {
        showToast("Redirecionando para o Google...", "info");
        return;
      }

      showToast("Conta Google conectada com sucesso.", "success");
      navigate("/");
    } catch (err) {
      console.error(err);
      showToast(getAuthErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page auth-page">
      <section className="auth-shell" aria-label="Cadastro Stellar Interaction">
        <div className="auth-brand">
          <span>Nova tripulação</span>
          <h1>Stellar Interaction</h1>
        </div>

        <form onSubmit={handleSubmit} className="auth-card">
          <p className="page-kicker">Crie sua conta</p>
          <h1>Cadastro</h1>

          <input
            placeholder="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Senha"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button className="stellar-button success" type="submit" disabled={loading}>
            {loading ? "Criando..." : "Criar conta"}
          </button>

          <button
            className="google-button"
            type="button"
            onClick={handleGoogleRegister}
            disabled={loading}
          >
            <span>G</span>
            Cadastrar com Google
          </button>

          <Link className="auth-back-link" to="/login">
            Voltar ao login
          </Link>
        </form>
      </section>
    </div>
  );
}
