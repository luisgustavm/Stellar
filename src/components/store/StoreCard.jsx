import { getStoreSlotLabel } from "../../utils/storeEquipment";

const typeLabels = {
  avatar: "Avatar",
  background: "Fundo",
};

export default function StoreCard({ item, owned, equipped, affordable, onSelect, onEquip }) {
  const actionLabel = owned ? (equipped ? "Equipado" : "Equipar") : "Comprar";
  const visualClass = `store-item-visual ${item.type} ${item.accent} ${item.gifClass || ""} item-${item.id}`;

  return (
    <article className={`store-card ${item.type} ${item.accent}`}>
      <div className={visualClass} aria-hidden="true">
        {item.image ? <img src={item.image} alt="" /> : <span className="store-item-symbol" />}
      </div>

      <div className="store-card-content">
        <div className="store-card-meta">
          <span>{typeLabels[item.type] || item.type}</span>
          {item.slot && <span>{getStoreSlotLabel(item)}</span>}
          <span>{item.rarity}</span>
        </div>

        <h3>{item.name}</h3>
        <p>{item.description}</p>

        <div className="store-card-footer">
          <strong>{item.price} moedas</strong>
          {owned && <span className="store-owned-badge">Comprado</span>}
          {!owned && !affordable && <span className="store-low-balance">Saldo baixo</span>}
        </div>
      </div>

      <button
        type="button"
        onClick={() => (owned ? onEquip?.(item) : onSelect?.(item))}
        disabled={owned && equipped}
        aria-label={`${actionLabel} ${item.name}`}
      >
        {actionLabel}
      </button>
    </article>
  );
}
