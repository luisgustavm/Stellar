import { Link } from "react-router-dom";
import "./Home.css";

const missionCards = [
  {
    to: "/planets",
    label: "Planetas",
    eyebrow: "Atlas orbital",
    description:
      "Compare distâncias, dimensões e curiosidades dos mundos do Sistema Solar.",
  },
  {
    to: "/mysteries",
    label: "Mistérios Cósmicos",
    eyebrow: "Fenômenos profundos",
    description:
      "Explore nebulosas, pulsares e estruturas que revelam a escala do universo.",
  },
  {
    to: "/quiz",
    label: "Quiz",
    eyebrow: "Desafio interativo",
    description:
      "Teste seus conhecimentos, evolua sua pontuação e aprenda em ritmo de missão.",
  },
  {
    to: "/game",
    label: "Jogo",
    eyebrow: "Simulação arcade",
    description:
      "Entre em uma experiência espacial mais dinâmica com objetivos e recompensa.",
  },
];

const stats = [
  { value: "08+", label: "planetas catalogados" },
  { value: "04", label: "módulos principais" },
  { value: "24h", label: "exploração disponível" },
];

export default function Home() {
  return (
    <div className="home-page">
      <main className="home-main">
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero-content">
            <p className="home-kicker">Exploração espacial interativa</p>
            <h1 id="home-title">Stellar Interaction</h1>
            <p className="home-lead">
              Navegue por planetas, mistérios, vídeos, quiz e jogos em uma
              experiência imersiva criada para aprender sobre o cosmos com ritmo
              de missão.
            </p>

            <div className="home-actions" aria-label="Ações principais">
              <Link className="home-primary-action" to="/planets">
                Iniciar exploração
              </Link>
              <Link className="home-secondary-action" to="/quiz">
                Testar conhecimento
              </Link>
            </div>

            <div className="home-stats" aria-label="Resumo da plataforma">
              {stats.map((item) => (
                <div className="home-stat" key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="home-orbit-panel" aria-hidden="true">
            <span className="orbit orbit-one" />
            <span className="orbit orbit-two" />
            <span className="orbit orbit-three" />
            <span className="home-core" />
          </div>
        </section>

        <section className="home-modules" aria-label="Módulos do Stellar Interaction">
          {missionCards.map((card) => (
            <Link className="home-module-card" to={card.to} key={card.to}>
              <span>{card.eyebrow}</span>
              <strong>{card.label}</strong>
              <p>{card.description}</p>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
