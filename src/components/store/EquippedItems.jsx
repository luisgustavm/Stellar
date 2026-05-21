// src/components/store/EquippedItems.jsx
export default function EquippedItems({ items = [] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="bg-white/10 border border-white/10 px-3 py-1 rounded-full text-white text-sm"
        >
          {item.name}
        </div>
      ))}
    </div>
  );
}