import { Link } from "react-router-dom";
import "./Legal.css";

export default function Terms() {
  return (
    <div className="legal-page">
      <main className="legal-shell">
        <nav className="legal-nav" aria-label="Navegacao legal">
          <strong>Stellar Interaction</strong>
          <div>
            <Link to="/">Inicio</Link>
            <Link to="/privacy">Privacidade</Link>
            <Link to="/login">Login</Link>
          </div>
        </nav>

        <article className="legal-card">
          <p className="page-kicker">Termos</p>
          <h1>Termos de Uso</h1>
          <p className="legal-note">
            O Stellar Interaction e um projeto educativo sobre astronomia,
            criado para estudo, exploracao visual e interacao com recursos de
            quiz, loja, jogo e conteudo espacial.
          </p>

          <h2>Uso do site</h2>
          <ul>
            <li>Use o site de forma respeitosa e dentro das leis aplicaveis.</li>
            <li>Nao tente explorar falhas, automatizar abusos ou alterar dados de outros usuarios.</li>
            <li>Informacoes astronomicas podem ser simplificadas para fins educativos.</li>
          </ul>

          <h2>Conta e seguranca</h2>
          <ul>
            <li>O usuario e responsavel por manter o acesso da conta protegido.</li>
            <li>Contas podem ser desativadas ou excluidas pelo proprio perfil.</li>
            <li>Recursos como moedas e ranking ainda dependem de validacoes do frontend.</li>
          </ul>

          <h2>Conteudo e feedback</h2>
          <p>
            Ao enviar feedback, voce permite que a mensagem seja usada para
            melhorar o projeto. Evite enviar senhas, documentos ou dados
            sensiveis pelo formulario.
          </p>

          <h2>Limitacoes</h2>
          <p>
            O site e fornecido como projeto educativo. Algumas funcionalidades
            podem mudar, ficar indisponiveis ou receber ajustes de seguranca e
            desempenho com o tempo.
          </p>
        </article>
      </main>
    </div>
  );
}
