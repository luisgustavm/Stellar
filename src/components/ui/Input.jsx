// src/components/ui/Input.jsx
export default function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full p-2 rounded-lg bg-black/40 border border-white/10 text-white outline-none focus:border-blue-500"
    />
  );
}