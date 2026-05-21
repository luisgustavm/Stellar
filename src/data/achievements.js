const ACHIEVEMENT_STORAGE_PREFIX = "stellar-achievements:";

export const achievementDefinitions = [
  {
    id: "first_quiz",
    title: "Primeiro Quiz",
    description: "Finalizou uma tentativa no quiz.",
    icon: "QZ",
  },
  {
    id: "quiz_master",
    title: "Mestre do Quiz",
    description: "Acertou todas as perguntas de uma tentativa.",
    icon: "10",
  },
  {
    id: "first_purchase",
    title: "Primeira Compra",
    description: "Comprou o primeiro item na loja.",
    icon: "$",
  },
  {
    id: "collector",
    title: "Colecionador",
    description: "Juntou 5 itens no inventario.",
    icon: "IV",
  },
  {
    id: "first_game",
    title: "Piloto Estelar",
    description: "Finalizou uma partida no jogo.",
    icon: "GO",
  },
  {
    id: "meteor_hunter",
    title: "Cacador de Meteoros",
    description: "Destruiu 20 meteoros em uma partida.",
    icon: "MT",
  },
  {
    id: "score_1000",
    title: "Pontuacao Orbital",
    description: "Fez 1000 pontos em uma partida.",
    icon: "1K",
  },
  {
    id: "centurion_stars",
    title: "Cem Estrelas",
    description: "Coletou 100 pontos de estrela em uma partida.",
    icon: "ST",
  },
  {
    id: "profile_ready",
    title: "Perfil Completo",
    description: "Salvou nome, username e avatar.",
    icon: "PF",
  },
];

export function getAchievementDefinition(id) {
  return achievementDefinitions.find((achievement) => achievement.id === id);
}

function getAchievementKey(uid) {
  return `${ACHIEVEMENT_STORAGE_PREFIX}${uid || "guest"}`;
}

export function readLocalAchievements(uid) {
  try {
    const stored = localStorage.getItem(getAchievementKey(uid));
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveLocalAchievements(uid, achievements) {
  if (!uid) return achievements;

  try {
    localStorage.setItem(getAchievementKey(uid), JSON.stringify(achievements));
  } catch (error) {
    console.warn("Nao foi possivel salvar conquistas locais:", error);
  }

  return achievements;
}

export function unlockAchievement(uid, id, metadata = {}) {
  const definition = getAchievementDefinition(id);
  if (!definition) return readLocalAchievements(uid);

  const current = readLocalAchievements(uid);
  if (current[id]) return current;

  const next = {
    ...current,
    [id]: {
      id,
      unlockedAt: Date.now(),
      ...metadata,
    },
  };

  return saveLocalAchievements(uid, next);
}

export function mergeAchievements(...sources) {
  return sources.reduce((merged, source) => {
    if (!source || typeof source !== "object") return merged;
    return {
      ...merged,
      ...source,
    };
  }, {});
}
