import { getStoreSlotLabel, isStoreItemEquipped } from "../../utils/storeEquipment";

const typeLabels = {
  avatar: "Avatar",
  background: "Fundo",
};

export default function Inventory({ items = [], equipped = {}, onEquip, onUnequip }) {
  if (!items.length) {
    return (
      <p className="inventory-empty">
        Nenhum item comprado ainda. Escolha um produto no catálogo para começar.
      </p>
    );
  }

  return (
    <div className="inventory-grid" aria-label="Itens comprados">
      {items.map((item) => {
        const isEquipped = isStoreItemEquipped(equipped, item);
        const visualClass = `inventory-visual ${item.type} ${item.accent} ${item.gifClass || ""} item-${item.id}`;

        return (
          <article key={item.id} className={`inventory-item ${item.accent}`}>
            <div className={visualClass} aria-hidden="true">
              {item.image ? <img src={item.image} alt="" /> : <span className="store-item-symbol" />}
            </div>
            <div>
              <span>{typeLabels[item.type] || item.type}</span>
              {item.slot && <span>{getStoreSlotLabel(item)}</span>}
              <p>{item.name}</p>
              {isEquipped && <strong>Equipado</strong>}
            </div>

            <div className="inventory-actions">
              <button type="button" onClick={() => onEquip?.(item)} disabled={isEquipped}>
                Equipar
              </button>
              <button type="button" onClick={() => onUnequip?.(item)} disabled={!isEquipped}>
                Remover
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
