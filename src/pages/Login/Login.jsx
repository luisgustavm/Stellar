// src/pages/Login/Login.jsx
import LoginForm from "../../components/auth/LoginForm";
import "./Login.css";

export default function Login() {
  return (
    <div className="login-page auth-page">
      <section className="auth-shell" aria-label="Login Stellar Interaction">
        <div className="auth-brand">
          <span>Central de acesso</span>
          <h1>Stellar Interaction</h1>
        </div>
        <LoginForm />
      </section>
    </div>
  );
}
