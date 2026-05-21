// src/components/user/UserInventory.jsx
export default function UserInventory({ items = [] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item, i) => (
        <div key={i} className="bg-black/40 border border-white/10 p-3 rounded-lg text-white">
          <img src={item.image} className="w-full h-20 object-cover rounded" />
          <p className="text-sm mt-2">{item.name}</p>
        </div>
      ))}
    </div>
  );
}