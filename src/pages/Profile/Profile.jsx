import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { StoreContext } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { UserContext } from "../../context/UserContext";
import AvatarAccessory from "../../components/user/AvatarAccessory";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import {
  achievementDefinitions,
  mergeAchievements,
  readLocalAchievements,
  unlockAchievement,
} from "../../data/achievements";
import {
  avatarPresets,
  buildDiceBearUrl,
  diceBearStyles,
  isRemoteAvatarValue,
} from "../../data/avatarOptions";
import { storeItems } from "../../data/storeItems";
import { auth, db } from "../../services/firebase";
import { getAuthErrorMessage } from "../../utils/authErrors";
import { getEquippedAvatarItems } from "../../utils/storeEquipment";
import "./Profile.css";

const AVATAR_STORAGE_PREFIX = "stellar-local-avatar:";
const PROFILE_STORAGE_PREFIX = "stellar-local-profile:";
const QUIZ_HISTORY_KEY = "stellar-quiz-history";
const GAME_STORAGE_PREFIX = "stellar-game:";

function formatDate(value) {
  if (!value) return "Data não disponível";

  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value);

  if (Number.isNaN(date.getTime())) return "Data não disponível";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTime(seconds = 0) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;

  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function readLocalJson(key, fallback = {}) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function readQuizHistory() {
  const history = readLocalJson(QUIZ_HISTORY_KEY, []);
  return Array.isArray(history) ? history : [];
}

function readBestGame(uid) {
  return readLocalJson(`${GAME_STORAGE_PREFIX}${uid || "guest"}`, null);
}

function getInitials(name = "Explorador") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function resolveInventoryItems(items = []) {
  return items
    .map((item) => {
      if (typeof item === "object") {
        const catalogItem = storeItems.find((storeItem) => String(storeItem.id) === String(item.id));
        return catalogItem ? { ...item, ...catalogItem } : item;
      }
      return storeItems.find((storeItem) => String(storeItem.id) === String(item));
    })
    .filter(Boolean);
}

function withTimeout(promise, timeout = 8000) {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error("timeout")), timeout);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

function readLocalProfile(uid) {
  if (!uid) return {};

  try {
    const stored = localStorage.getItem(`${PROFILE_STORAGE_PREFIX}${uid}`);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn("Não foi possível ler o perfil local:", error);
    return {};
  }
}

function saveLocalProfile(uid, payload) {
  if (!uid) return;

  try {
    const current = readLocalProfile(uid);
    localStorage.setItem(
      `${PROFILE_STORAGE_PREFIX}${uid}`,
      JSON.stringify({
        ...current,
        ...payload,
        updatedAt: Date.now(),
      })
    );
  } catch (error) {
    console.warn("Não foi possível salvar o perfil local:", error);
  }
}

function readAvatarFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 320;
        const scale = Math.min(size / image.width, size / image.height, 1);
        const width = Math.round(image.width * scale);
        const height = Math.round(image.height * scale);

        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#020617";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);

        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };

      image.onerror = reject;
      image.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Profile() {
  const { user, logout, setUser, deactivateAccount, deleteAccount } = useAuth();
  const { userData, setUserData } = useContext(UserContext);
  const { inventory: sessionInventory, equipped: sessionEquipped } = useContext(StoreContext);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localAvatar, setLocalAvatar] = useState("");
  const [localProfile, setLocalProfile] = useState({});
  const [localAchievements, setLocalAchievements] = useState({});
  const [quizHistory, setQuizHistory] = useState([]);
  const [bestGame, setBestGame] = useState(null);
  const [avatarDraft, setAvatarDraft] = useState("");
  const [avatarFileName, setAvatarFileName] = useState("");
  const [avatarSeed, setAvatarSeed] = useState("");
  const [avatarStyle, setAvatarStyle] = useState(diceBearStyles[0].id);
  const [form, setForm] = useState({
    name: "",
    username: "",
    photoURL: "",
  });

  const profile = { ...user, ...userData, ...localProfile };
  const displayName = profile?.name || profile?.username || "Explorador";
  const username = profile?.username || "Sem username";
  const email = profile?.email || "Email não informado";
  const remotePhoto = profile?.photoURL || profile?.avatarUrl || "";
  const photo = localAvatar || remotePhoto;
  const editPhoto = avatarDraft || form.photoURL;
  const coins = profile?.coins ?? 0;
  const createdAt = formatDate(profile?.createdAt);
  const inventory = resolveInventoryItems(profile?.inventory?.length ? profile.inventory : sessionInventory);
  const equipped = profile?.equipped || sessionEquipped || {};
  const equippedAvatarItems = getEquippedAvatarItems(equipped);

  useEffect(() => {
    if (!user?.uid) {
      setLocalAvatar("");
      setLocalProfile({});
      setLocalAchievements({});
      setQuizHistory([]);
      setBestGame(null);
      setAvatarDraft("");
      return;
    }

    const savedAvatar = localStorage.getItem(`${AVATAR_STORAGE_PREFIX}${user.uid}`) || "";
    const savedProfile = readLocalProfile(user.uid);
    setLocalProfile(savedProfile);
    setLocalAchievements(readLocalAchievements(user.uid));
    setQuizHistory(readQuizHistory());
    setBestGame(readBestGame(user.uid));
    setLocalAvatar(savedAvatar);
    setAvatarDraft(savedAvatar);
    setAvatarSeed(
      savedProfile.username ||
        savedProfile.name ||
        user.username ||
        user.name ||
        user.email?.split("@")[0] ||
        "stellar-explorer"
    );
  }, [user?.uid]);

  useEffect(() => {
    setForm({
      name: profile?.name || "",
      username: profile?.username || "",
      photoURL: remotePhoto,
    });
  }, [profile?.name, profile?.username, remotePhoto]);

  const completion = useMemo(() => {
    const checks = [
      Boolean(profile?.name),
      Boolean(profile?.username),
      Boolean(profile?.email),
      Boolean(photo),
      inventory.length > 0,
    ];

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [profile?.name, profile?.username, profile?.email, photo, inventory.length]);

  const metrics = [
    { label: "Moedas", value: coins },
    { label: "Itens", value: inventory.length },
    { label: "Perfil completo", value: `${completion}%` },
  ];
  const achievements = mergeAchievements(profile?.achievements, localAchievements);
  const unlockedAchievementIds = new Set(Object.keys(achievements));
  const unlockedCount = unlockedAchievementIds.size;
  const lastQuiz = quizHistory[0];
  const lastGameReward = profile?.lastGameReward;
  const dashboardItems = [
    {
      label: "Ultimo quiz",
      value: lastQuiz ? `${lastQuiz.score}/${lastQuiz.total}` : "Sem registro",
      detail: lastQuiz ? `${lastQuiz.accuracy}% de acerto` : "Finalize um quiz",
    },
    {
      label: "Recorde no jogo",
      value: bestGame ? bestGame.score : profile?.bestGame?.score || 0,
      detail: `Tempo ${formatTime(bestGame?.time || profile?.bestGame?.time || 0)}`,
    },
    {
      label: "Conquistas",
      value: `${unlockedCount}/${achievementDefinitions.length}`,
      detail: unlockedCount ? "badges desbloqueados" : "Comece uma missao",
    },
    {
      label: "Ultima recompensa",
      value: lastGameReward?.amount ? `+${lastGameReward.amount}` : "Nenhuma",
      detail: lastGameReward?.stars ? `${lastGameReward.stars} estrelas no jogo` : "Ganhe moedas jogando",
    },
  ];

  async function handleAvatarFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Escolha um arquivo de imagem.", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Escolha uma imagem de até 5MB.", "error");
      return;
    }

    try {
      const dataUrl = await readAvatarFile(file);
      setAvatarDraft(dataUrl);
      setAvatarFileName(file.name);
      setForm((current) => ({ ...current, photoURL: "" }));
    } catch (error) {
      console.error(error);
      showToast("Não foi possível carregar essa imagem.", "error");
    }
  }

  function applyRemoteAvatar(src) {
    setAvatarDraft("");
    setAvatarFileName("");
    setForm((current) => ({ ...current, photoURL: src }));
  }

  function handleSelectPreset(src) {
    applyRemoteAvatar(src);
    showToast("Avatar pronto selecionado. Salve o perfil para aplicar.", "success");
  }

  function handleGenerateAvatar() {
    const seed =
      avatarSeed.trim() ||
      form.username ||
      form.name ||
      displayName ||
      email ||
      "stellar-explorer";
    const generatedUrl = buildDiceBearUrl(avatarStyle, seed);

    setAvatarSeed(seed);
    applyRemoteAvatar(generatedUrl);
    showToast("Avatar gerado. Salve o perfil para aplicar.", "success");
  }

  function handleRandomAvatar() {
    const base =
      avatarSeed.trim() ||
      form.username ||
      form.name ||
      displayName ||
      "stellar-explorer";
    const randomSeed = `${base}-${Math.random().toString(36).slice(2, 8)}`;
    const generatedUrl = buildDiceBearUrl(avatarStyle, randomSeed);

    setAvatarSeed(randomSeed);
    applyRemoteAvatar(generatedUrl);
    showToast("Novo avatar gerado. Salve o perfil para aplicar.", "success");
  }

  function handleAvatarUrlChange(value) {
    setAvatarDraft("");
    setAvatarFileName("");
    setForm((current) => ({ ...current, photoURL: value }));
  }

  async function handleSaveProfile(event) {
    event.preventDefault();

    const nextName = form.name.trim();
    const nextUsername = form.username.trim().replace(/^@+/, "");
    const nextRemotePhoto = form.photoURL.trim();

    if (!nextName || !nextUsername) {
      showToast("Informe nome e username para salvar.", "error");
      return;
    }

    if (nextUsername.length < 3) {
      showToast("O username precisa ter pelo menos 3 caracteres.", "error");
      return;
    }

    if (nextRemotePhoto && !isRemoteAvatarValue(nextRemotePhoto)) {
      showToast("Use uma URL com http/https ou escolha um avatar pronto.", "error");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        name: nextName,
        username: nextUsername,
        photoURL: nextRemotePhoto || null,
      };
      const localPayload = {
        ...payload,
        avatarUrl: avatarDraft || nextRemotePhoto || null,
      };
      let syncedWithFirestore = false;

      if (user?.uid) {
        if (avatarDraft) {
          localStorage.setItem(`${AVATAR_STORAGE_PREFIX}${user.uid}`, avatarDraft);
        } else {
          localStorage.removeItem(`${AVATAR_STORAGE_PREFIX}${user.uid}`);
        }

        saveLocalProfile(user.uid, localPayload);
        setLocalProfile(localPayload);

        try {
          await withTimeout(setDoc(doc(db, "users", user.uid), payload, { merge: true }), 4500);
          syncedWithFirestore = true;
        } catch (error) {
          console.warn("Perfil salvo localmente porque o Firebase demorou ou recusou:", error);
        }
      }

      if (auth.currentUser) {
        updateProfile(auth.currentUser, {
          displayName: nextName,
          photoURL: nextRemotePhoto || null,
        }).catch(() => {});
      }

      setLocalAvatar(avatarDraft);
      setUser?.((current) => ({ ...current, ...localPayload }));
      setUserData?.((current) => ({ ...current, ...localPayload }));

      if (user?.uid && (avatarDraft || nextRemotePhoto || localAvatar)) {
        const nextAchievements = unlockAchievement(user.uid, "profile_ready");
        setLocalAchievements(nextAchievements);
        setUserData?.((current) => ({
          ...current,
          achievements: {
            ...(current?.achievements || {}),
            ...nextAchievements,
          },
        }));
        setDoc(
          doc(db, "users", user.uid),
          {
            achievements: nextAchievements,
          },
          { merge: true }
        ).catch((error) => {
          console.warn("Conquista de perfil salva localmente:", error);
        });
      }

      setAvatarFileName("");
      setIsEditing(false);
      showToast(
        syncedWithFirestore
          ? "Dados do perfil salvos com sucesso."
          : "Dados salvos neste navegador. O Firebase será sincronizado quando estiver disponível.",
        "success"
      );
    } catch (error) {
      console.error(error);
      showToast("Não foi possível salvar seus dados agora.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancelEdit() {
    setForm({
      name: profile?.name || "",
      username: profile?.username || "",
      photoURL: remotePhoto,
    });
    setAvatarDraft(localAvatar);
    setAvatarFileName("");
    setIsEditing(false);
  }

  function handleRemoveAvatar() {
    setAvatarDraft("");
    setAvatarFileName("");
    setForm((current) => ({ ...current, photoURL: "" }));
  }

  async function handleLogout() {
    setIsSigningOut(true);

    try {
      await logout();
      showToast("Você saiu da sua conta.", "success");
      navigate("/login", { replace: true });
    } catch (error) {
      console.error(error);
      showToast("Não foi possível sair agora. Tente novamente.", "error");
      setIsSigningOut(false);
    }
  }

  async function handleDeactivateAccount() {
    setIsDeactivating(true);

    try {
      await deactivateAccount();
      showToast("Conta desativada com sucesso.", "success");
      setConfirmAction(null);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error(error);
      showToast(getAuthErrorMessage(error), "error");
      setIsDeactivating(false);
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);

    try {
      await deleteAccount();
      showToast("Conta excluída com sucesso.", "success");
      setConfirmAction(null);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error(error);
      showToast(getAuthErrorMessage(error), "error");
      setIsDeleting(false);
    }
  }

  return (
    <div className="profile-page">
      <header className="profile-hero">
        <div className="profile-avatar" aria-label={`Avatar de ${displayName}`}>
          {photo ? <img src={photo} alt="" /> : <span>{getInitials(displayName)}</span>}
          {equippedAvatarItems.map((item) => (
            <AvatarAccessory key={item.id} item={item} size="profile" />
          ))}
        </div>

        <div className="profile-identity">
          <p className="page-kicker">Perfil do usuário</p>
          <h1>{displayName}</h1>
          <p>@{username}</p>
          <p>{email}</p>
        </div>

        <div className="profile-actions" aria-label="Ações do perfil">
          <button type="button" onClick={() => setIsEditing(true)}>
            Editar dados
          </button>
          <button type="button" onClick={() => navigate("/store")}>
            Loja
          </button>
          <button
            type="button"
            className="danger"
            onClick={handleLogout}
            disabled={isSigningOut || isDeactivating || isDeleting}
          >
            {isSigningOut ? "Saindo..." : "Sair"}
          </button>
        </div>
      </header>

      {isSigningOut && (
        <p className="profile-status-message" role="status">
          Encerrando sua sessão com segurança...
        </p>
      )}

      <section className="profile-metrics" aria-label="Resumo do perfil">
        {metrics.map((metric) => (
          <article className="profile-metric-card" key={metric.label}>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </article>
        ))}
      </section>

      <main className="profile-grid">
        <section className="profile-panel" aria-labelledby="account-title">
          <div className="profile-panel-heading profile-panel-heading-row">
            <div>
              <p className="page-kicker">Conta</p>
              <h2 id="account-title">Dados principais</h2>
            </div>
            {!isEditing && (
              <button
                className="profile-inline-button"
                type="button"
                onClick={() => setIsEditing(true)}
              >
                Editar
              </button>
            )}
          </div>

          {isEditing ? (
            <form className="profile-edit-form" onSubmit={handleSaveProfile}>
              <div className="profile-avatar-editor">
                <div className="profile-avatar preview" aria-hidden="true">
                  {editPhoto ? <img src={editPhoto} alt="" /> : <span>{getInitials(form.name || displayName)}</span>}
                </div>

                <div className="profile-avatar-tools">
                  <div className="profile-avatar-tool-header">
                    <span>Avatar gratuito</span>
                    <small>Escolha, gere ou use uma URL externa.</small>
                  </div>

                  <div className="profile-avatar-presets" aria-label="Avatares prontos">
                    {avatarPresets.map((avatar) => (
                      <button
                        type="button"
                        key={avatar.id}
                        className={form.photoURL === avatar.src ? "is-selected" : ""}
                        onClick={() => handleSelectPreset(avatar.src)}
                      >
                        <img src={avatar.src} alt="" />
                        <span>{avatar.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="profile-avatar-generator">
                    <label>
                      <span>Gerar por nome</span>
                      <input
                        value={avatarSeed}
                        onChange={(event) => setAvatarSeed(event.target.value)}
                        placeholder={form.username || displayName}
                      />
                    </label>

                    <label>
                      <span>Estilo</span>
                      <select
                        value={avatarStyle}
                        onChange={(event) => setAvatarStyle(event.target.value)}
                      >
                        {diceBearStyles.map((style) => (
                          <option key={style.id} value={style.id}>
                            {style.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button type="button" onClick={handleGenerateAvatar}>
                      Gerar
                    </button>
                    <button type="button" className="secondary" onClick={handleRandomAvatar}>
                      Aleatorio
                    </button>
                  </div>

                  <label className="profile-file-label">
                    <span>Arquivo local</span>
                    <input type="file" accept="image/*" onChange={handleAvatarFile} />
                  </label>
                  {avatarFileName && <p className="profile-file-name">{avatarFileName}</p>}
                  <button type="button" className="secondary" onClick={handleRemoveAvatar}>
                    Remover avatar
                  </button>
                </div>
              </div>

              <label>
                <span>Nome</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Seu nome"
                />
              </label>

              <label>
                <span>Username</span>
                <input
                  value={form.username}
                  onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  placeholder="explorador"
                />
              </label>

              <label>
                <span>URL externa do avatar</span>
                <input
                  value={form.photoURL}
                  onChange={(event) => handleAvatarUrlChange(event.target.value)}
                  placeholder="https://exemplo.com/avatar.png"
                />
              </label>

              <label>
                <span>Email</span>
                <input value={email} disabled />
              </label>

              <p className="profile-form-note">
                Sem Firebase Storage: arquivo local fica salvo apenas neste
                navegador. Avatar pronto, DiceBear e URL externa salvam apenas
                um caminho de texto no Firestore.
              </p>

              <div className="profile-form-actions">
                <button type="submit" disabled={isSaving}>
                  {isSaving ? "Salvando..." : "Salvar dados"}
                </button>
                <button type="button" className="secondary" onClick={handleCancelEdit} disabled={isSaving}>
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <dl className="profile-data-list">
              <div>
                <dt>Nome</dt>
                <dd>{displayName}</dd>
              </div>
              <div>
                <dt>Username</dt>
                <dd>{username}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{email}</dd>
              </div>
              <div>
                <dt>Conta criada em</dt>
                <dd>{createdAt}</dd>
              </div>
            </dl>
          )}
        </section>

        <section className="profile-panel" aria-labelledby="progress-title">
          <div className="profile-panel-heading">
            <p className="page-kicker">Progresso</p>
            <h2 id="progress-title">Estação pessoal</h2>
          </div>

          <div className="profile-progress">
            <div>
              <span>Completude do perfil</span>
              <strong>{completion}%</strong>
            </div>
            <progress value={completion} max="100">
              {completion}%
            </progress>
          </div>

          <p>
            Complete seu nome, username, email, avatar e inventário para deixar
            sua estação mais preparada para a exploração.
          </p>
        </section>

        <section className="profile-panel profile-wide-panel" aria-labelledby="dashboard-title">
          <div className="profile-panel-heading">
            <p className="page-kicker">Dashboard</p>
            <h2 id="dashboard-title">Resumo da jornada</h2>
          </div>

          <div className="profile-dashboard-grid">
            {dashboardItems.map((item) => (
              <article key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.detail}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="profile-panel profile-wide-panel" aria-labelledby="achievements-title">
          <div className="profile-panel-heading">
            <p className="page-kicker">Conquistas</p>
            <h2 id="achievements-title">Badges desbloqueaveis</h2>
          </div>

          <div className="profile-achievements-grid">
            {achievementDefinitions.map((achievement) => {
              const unlocked = unlockedAchievementIds.has(achievement.id);

              return (
                <article key={achievement.id} className={unlocked ? "is-unlocked" : ""}>
                  <span>{achievement.icon}</span>
                  <strong>{achievement.title}</strong>
                  <small>{achievement.description}</small>
                </article>
              );
            })}
          </div>
        </section>

        <section className="profile-panel profile-wide-panel" aria-labelledby="inventory-title">
          <div className="profile-panel-heading">
            <p className="page-kicker">Inventário</p>
            <h2 id="inventory-title">Itens e equipamentos</h2>
          </div>

          <div className="profile-equipped">
            <article>
              <span>Avatar equipado</span>
              <strong>{equipped?.avatar?.name || equipped?.avatar || "Nenhum"}</strong>
            </article>
            <article>
              <span>Fundo equipado</span>
              <strong>{equipped?.background?.name || equipped?.background || "Nenhum"}</strong>
            </article>
          </div>

          {inventory.length > 0 ? (
            <ul className="profile-inventory-list" aria-label="Itens comprados">
              {inventory.slice(0, 6).map((item) => (
                <li key={item.id || item.name}>
                  <span>{item.name}</span>
                  <small>{item.type || "item"}</small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="profile-empty">
              Você ainda não tem itens no inventário. Visite a loja para
              personalizar sua jornada.
            </p>
          )}
        </section>

        <section className="profile-panel profile-wide-panel" aria-labelledby="security-title">
          <div className="profile-panel-heading">
            <p className="page-kicker">Segurança</p>
            <h2 id="security-title">Sessão atual</h2>
          </div>

          <p>
            Sua autenticação é protegida pelo Firebase. Use o botão de sair ao
            finalizar em computadores compartilhados.
          </p>
          <div className="profile-security-actions">
            <button
              type="button"
              className="profile-outline-button"
              onClick={handleLogout}
              disabled={isSigningOut || isDeactivating || isDeleting}
            >
              Encerrar sessão
            </button>
            <button
              type="button"
              className="profile-warning-button"
              onClick={() => setConfirmAction("deactivate")}
              disabled={isSigningOut || isDeactivating || isDeleting}
            >
              {isDeactivating ? "Desativando..." : "Desativar conta"}
            </button>
            <button
              type="button"
              className="profile-delete-button"
              onClick={() => setConfirmAction("delete")}
              disabled={isSigningOut || isDeactivating || isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir conta"}
            </button>
          </div>
        </section>
      </main>

      <ConfirmDialog
        open={confirmAction === "deactivate"}
        variant="warning"
        title="Desativar conta?"
        message="Você sairá agora e essa conta não poderá acessar o app até ser reativada manualmente no banco de dados."
        confirmLabel="Desativar"
        loading={isDeactivating}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleDeactivateAccount}
      />

      <ConfirmDialog
        open={confirmAction === "delete"}
        variant="danger"
        title="Excluir conta permanentemente?"
        message="Essa ação remove seu acesso do Firebase Auth e não pode ser desfeita. Por segurança, talvez seja necessário entrar novamente."
        confirmLabel="Excluir conta"
        loading={isDeleting}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}
