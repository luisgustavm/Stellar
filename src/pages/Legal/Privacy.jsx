import { Link } from "react-router-dom";
import "./Legal.css";

export default function Privacy() {
  return (
    <div className="legal-page">
      <main className="legal-shell">
        <nav className="legal-nav" aria-label="Navegacao legal">
          <strong>Stellar Interaction</strong>
          <div>
            <Link to="/">Inicio</Link>
            <Link to="/terms">Termos</Link>
            <Link to="/login">Login</Link>
          </div>
        </nav>

        <article className="legal-card">
          <p className="page-kicker">Privacidade</p>
          <h1>Politica de Privacidade</h1>
          <p className="legal-note">
            Esta pagina explica, de forma simples, quais dados o Stellar
            Interaction usa para login, perfil, feedback, quiz, loja e jogo.
          </p>

          <h2>Dados que podemos usar</h2>
          <ul>
            <li>Nome, email, username e foto/avatar informados no perfil.</li>
            <li>Dados de autenticacao fornecidos pelo Firebase Auth.</li>
            <li>Moedas, inventario, itens equipados, conquistas e recordes.</li>
            <li>Mensagens enviadas pelo formulario de feedback.</li>
            <li>Preferencias salvas no navegador, como avatar local e som do jogo.</li>
          </ul>

          <h2>Como esses dados sao usados</h2>
          <ul>
            <li>Para permitir login, cadastro e acesso protegido ao site.</li>
            <li>Para salvar progresso, personalizacao e historico do usuario.</li>
            <li>Para melhorar o projeto a partir dos feedbacks enviados.</li>
            <li>Para exibir ranking e conquistas dentro da experiencia do site.</li>
          </ul>

          <h2>Servicos externos</h2>
          <p>
            O site usa Firebase para autenticacao e banco de dados. O feedback
            pode ser enviado por FormSubmit para o email do projeto. Avatares
            gerados podem usar DiceBear quando o usuario escolhe essa opcao.
          </p>

          <h2>Controle do usuario</h2>
          <p>
            O usuario pode sair da conta, editar o perfil, desativar ou excluir
            a conta na pagina de perfil. Dados locais tambem podem ser removidos
            limpando o armazenamento do navegador.
          </p>
        </article>
      </main>
    </div>
  );
}
