import { useEffect } from "react";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "info",
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event) {
      if (event.key === "Escape" && !loading) onCancel?.();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, onCancel, open]);

  if (!open) return null;

  return (
    <div className="confirm-dialog-backdrop" role="presentation" onClick={loading ? undefined : onCancel}>
      <section
        className={`confirm-dialog-card ${variant}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="confirm-dialog-orb" aria-hidden="true" />

        <div>
          <p className="page-kicker">Confirmação</p>
          <h2 id="confirm-dialog-title">{title}</h2>
          <p id="confirm-dialog-message">{message}</p>
        </div>

        <div className="confirm-dialog-actions">
          <button type="button" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button type="button" className="confirm-action" onClick={onConfirm} disabled={loading}>
            {loading ? "Aguarde..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
