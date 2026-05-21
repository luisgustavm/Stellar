import StoreCard from "./StoreCard";
import { isStoreItemEquipped } from "../../utils/storeEquipment";

export default function StoreGrid({
  items = [],
  ownedIds = new Set(),
  balance = 0,
  equipped = {},
  onSelect,
  onEquip,
}) {
  return (
    <div className="store-grid" aria-live="polite">
      {items.map((item) => {
        const owned = ownedIds.has(item.id);
        const isEquipped = isStoreItemEquipped(equipped, item);

        return (
          <StoreCard
            key={item.id}
            item={item}
            owned={owned}
            equipped={isEquipped}
            affordable={balance >= item.price}
            onSelect={onSelect}
            onEquip={onEquip}
          />
        );
      })}
    </div>
  );
}
