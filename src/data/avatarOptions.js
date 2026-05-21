export const avatarPresets = [
  {
    id: "nave",
    name: "Nave",
    src: "/images/avatars/nave.png",
  },
  {
    id: "astronauta",
    name: "Astronauta",
    src: "/images/avatars/avatar-astronauta.svg",
  },
  {
    id: "planeta",
    name: "Planeta",
    src: "/images/avatars/avatar-planeta.svg",
  },
  {
    id: "foguete",
    name: "Foguete",
    src: "/images/avatars/avatar-foguete.svg",
  },
  {
    id: "cometa",
    name: "Cometa",
    src: "/images/avatars/avatar-cometa.svg",
  },
  {
    id: "robo",
    name: "Robo",
    src: "/images/avatars/avatar-robo.svg",
  },
  {
    id: "galaxia",
    name: "Galaxia",
    src: "/images/avatars/avatar-galaxia.svg",
  },
];

export const diceBearStyles = [
  { id: "bottts", name: "Robo espacial" },
  { id: "adventurer", name: "Explorador" },
  { id: "personas", name: "Tripulante" },
  { id: "pixel-art", name: "Pixel" },
  { id: "identicon", name: "Simbolo" },
];

export function normalizeAvatarSeed(value) {
  const seed = String(value || "stellar-explorer")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);

  return seed || "stellar-explorer";
}

export function buildDiceBearUrl(style, seed) {
  const avatarStyle = diceBearStyles.some((item) => item.id === style)
    ? style
    : diceBearStyles[0].id;

  const params = new URLSearchParams({
    seed: normalizeAvatarSeed(seed),
    backgroundColor: "020617,082f49,1e1b4b",
    radius: "50",
  });

  return `https://api.dicebear.com/9.x/${avatarStyle}/svg?${params.toString()}`;
}

export function isRemoteAvatarValue(value) {
  const avatar = String(value || "").trim();

  return (
    avatar === "" ||
    avatar.startsWith("/images/avatars/") ||
    /^https?:\/\//i.test(avatar)
  );
}
