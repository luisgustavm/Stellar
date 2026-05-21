// src/pages/ForgotPassword/ForgotPassword.jsx
import ForgotPasswordForm from "../../components/auth/ForgotPasswordForm";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  return (
    <div className="forgot-page auth-page">
      <section className="auth-shell" aria-label="Recuperar senha Stellar Interaction">
        <div className="auth-brand">
          <span>Recuperação de acesso</span>
          <h1>Stellar Interaction</h1>
        </div>
        <ForgotPasswordForm />
      </section>
    </div>
  );
}
