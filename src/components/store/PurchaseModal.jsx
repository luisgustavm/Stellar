import { useEffect } from "react";
import { getStoreSlotLabel } from "../../utils/storeEquipment";

export default function PurchaseModal({
  open,
  item,
  balance = 0,
  owned = false,
  busy = false,
  onConfirm,
  onClose,
}) {
  const canBuy = item && balance >= item.price && !owned && !busy;

  useEffect(() => {
    if (!open) return undefined;

    function handleEsc(event) {
      if (event.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open || !item) return null;

  const visualClass = `store-item-visual ${item.type} ${item.accent} ${item.gifClass || ""} item-${item.id}`;

  return (
    <div className="store-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="store-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="store-modal-close"
          type="button"
          onClick={onClose}
          aria-label="Fechar confirmação de compra"
        >
          X
        </button>

        <div className={visualClass} aria-hidden="true">
          {item.image ? <img src={item.image} alt="" /> : <span className="store-item-symbol" />}
        </div>

        <p className="page-kicker">Confirmar compra</p>
        <h2 id="purchase-title">{item.name}</h2>
        <p>{item.description}</p>
        {item.slot && <p className="store-slot-note">Slot: {getStoreSlotLabel(item)}</p>}

        <dl className="purchase-summary">
          <div>
            <dt>Preço</dt>
            <dd>{item.price} moedas</dd>
          </div>
          <div>
            <dt>Seu saldo</dt>
            <dd>{balance} moedas</dd>
          </div>
        </dl>

        {owned && <p className="store-alert success">Você já possui este item.</p>}
        {!owned && !canBuy && (
          <p className="store-alert">Saldo insuficiente para concluir esta compra.</p>
        )}

        <div className="store-modal-actions">
          <button type="button" className="store-secondary-button" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" onClick={() => onConfirm?.(item)} disabled={!canBuy}>
            {busy ? "Processando..." : "Comprar agora"}
          </button>
        </div>
      </section>
    </div>
  );
}
