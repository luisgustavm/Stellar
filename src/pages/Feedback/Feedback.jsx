import { useContext, useEffect, useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { UserContext } from "../../context/UserContext";
import { db } from "../../services/firebase";
import "./Feedback.css";

const FEEDBACK_STORAGE_KEY = "stellar-feedback-local";
const FEEDBACK_TARGET_EMAIL = import.meta.env.VITE_FEEDBACK_EMAIL || "stellarinteraction@gmail.com";
const FEEDBACK_EMAIL_ENDPOINT = `https://formsubmit.co/ajax/${encodeURIComponent(FEEDBACK_TARGET_EMAIL)}`;

const categories = [
  { value: "experiencia", label: "Experiência geral" },
  { value: "bug", label: "Bug ou erro" },
  { value: "visual", label: "Visual e acessibilidade" },
  { value: "conteudo", label: "Conteúdo" },
];

function withTimeout(promise, timeout = 5500) {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error("timeout")), timeout);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

function saveLocalFeedback(payload) {
  try {
    const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    const current = stored ? JSON.parse(stored) : [];
    const next = [
      {
        ...payload,
        id: globalThis.crypto?.randomUUID?.() || String(Date.now()),
        savedLocally: true,
      },
      ...current,
    ].slice(0, 20);

    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn("Não foi possível salvar o feedback localmente:", error);
  }
}

async function sendFeedbackEmail(payload) {
  const response = await fetch(FEEDBACK_EMAIL_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      _subject: `Novo feedback - ${payload.categoryLabel}`,
      _template: "table",
      _captcha: "false",
      name: payload.name,
      email: payload.email,
      _replyto: payload.email,
      categoria: payload.categoryLabel,
      avaliacao: `${payload.rating}/5`,
      mensagem: payload.message,
      usuarioId: payload.uid || "sem login",
      origem: "Stellar Interaction",
      criadoEm: new Date(payload.createdAt).toLocaleString("pt-BR"),
    }),
  });

  if (!response.ok) {
    throw new Error(`email-${response.status}`);
  }

  return response.json().catch(() => ({}));
}

export default function Feedback() {
  const { user } = useAuth();
  const { userData } = useContext(UserContext);
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    category: "experiencia",
    message: "",
  });
  const [rating, setRating] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [lastSubmission, setLastSubmission] = useState(null);

  const displayName = userData?.name || user?.name || user?.username || "";
  const displayEmail = userData?.email || user?.email || "";
  const selectedCategory = useMemo(
    () => categories.find((category) => category.value === form.category),
    [form.category]
  );

  useEffect(() => {
    setForm((current) => ({
      ...current,
      name: current.name || displayName,
      email: current.email || displayEmail,
    }));
  }, [displayEmail, displayName]);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      uid: user?.uid || null,
      name: form.name.trim(),
      email: form.email.trim(),
      category: form.category,
      categoryLabel: selectedCategory?.label || "Feedback",
      rating,
      message: form.message.trim(),
      createdAt: Date.now(),
      source: "web",
    };

    if (!payload.name || !payload.email) {
      showToast("Informe nome e email para enviar o feedback.", "error");
      return;
    }

    if (rating === 0) {
      showToast("Escolha uma avaliação de 1 a 5 estrelas.", "error");
      return;
    }

    if (payload.message.length < 12) {
      showToast("Escreva uma mensagem com pelo menos 12 caracteres.", "error");
      return;
    }

    setIsSending(true);

    try {
      const [firestoreResult, emailResult] = await withTimeout(
        Promise.allSettled([
          addDoc(collection(db, "feedback"), {
            ...payload,
            targetEmail: FEEDBACK_TARGET_EMAIL,
            createdAt: serverTimestamp(),
          }),
          sendFeedbackEmail(payload),
        ]),
        9000
      );
      const firestoreSynced = firestoreResult.status === "fulfilled";

      if (emailResult.status === "rejected") {
        throw emailResult.reason;
      }

      if (!firestoreSynced) {
        console.warn("Feedback enviado por email, mas nao salvo no Firebase:", firestoreResult.reason);
      }

      setLastSubmission({
        ...payload,
        savedLocally: false,
        sentToEmail: FEEDBACK_TARGET_EMAIL,
        firestoreSynced,
      });
      showToast(
        firestoreSynced
          ? "Feedback enviado por email e salvo no Firebase."
          : "Feedback enviado por email. O Firebase nao sincronizou agora.",
        "success"
      );
    } catch (error) {
      console.warn("Feedback salvo localmente porque o envio por email ou Firebase falhou:", error);
      saveLocalFeedback({ ...payload, targetEmail: FEEDBACK_TARGET_EMAIL });
      setLastSubmission({ ...payload, savedLocally: true, targetEmail: FEEDBACK_TARGET_EMAIL });
      showToast("Nao foi possivel enviar por email agora. O feedback ficou salvo neste navegador.", "error");
    } finally {
      setForm((current) => ({
        ...current,
        message: "",
        category: "experiencia",
      }));
      setRating(0);
      setIsSending(false);
    }
  }

  return (
    <div className="feedback-page">
      <main className="feedback-shell">
        <section className="feedback-intro" aria-labelledby="feedback-title">
          <p className="page-kicker">Central de transmissão</p>
          <h1 id="feedback-title">Feedback</h1>
          <p>
            Envie bugs, ideias de conteúdo ou ajustes visuais para melhorar a
            experiência do Stellar Interaction.
          </p>

          <div className="feedback-status-grid" aria-label="Status do feedback">
            <article>
              <strong>5 estrelas</strong>
              <span>avaliação máxima</span>
            </article>
            <article>
              <strong>Email</strong>
              <span>{FEEDBACK_TARGET_EMAIL}</span>
            </article>
          </div>
        </section>

        <form className="feedback-card" onSubmit={handleSubmit} aria-busy={isSending}>
          <div className="feedback-card-heading">
            <div>
              <p className="page-kicker">Relatório</p>
              <h2>Enviar feedback</h2>
            </div>
            <span>{selectedCategory?.label}</span>
          </div>

          <div className="feedback-form-grid">
            <label>
              <span>Nome</span>
              <input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                autoComplete="name"
              />
            </label>

            <label>
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                autoComplete="email"
              />
            </label>
          </div>

          <label>
            <span>Categoria</span>
            <select
              value={form.category}
              onChange={(event) => updateField("category", event.target.value)}
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="feedback-rating">
            <legend>Avaliação</legend>
            <div className="feedback-stars" aria-label="Avaliação de 1 a 5 estrelas">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setRating(value)}
                  className={value <= rating ? "is-active" : ""}
                  aria-label={`${value} estrela${value > 1 ? "s" : ""}`}
                  aria-pressed={value <= rating}
                >
                  ★
                </button>
              ))}
            </div>
          </fieldset>

          <label>
            <span>Mensagem</span>
            <textarea
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
              rows={6}
              maxLength={900}
            />
          </label>

          <div className="feedback-footer">
            <small>{form.message.trim().length}/900 caracteres</small>
            <button className="stellar-button" type="submit" disabled={isSending}>
              {isSending ? "Enviando..." : "Enviar feedback"}
            </button>
          </div>

          {lastSubmission && (
            <p className="feedback-confirmation" role="status">
              {lastSubmission.savedLocally
                ? "Ultimo feedback salvo no navegador."
                : `Ultimo feedback enviado para ${lastSubmission.sentToEmail}.`}
            </p>
          )}
        </form>
      </main>
    </div>
  );
}
