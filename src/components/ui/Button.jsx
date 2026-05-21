// src/components/ui/Button.jsx
export default function Button({ children, onClick, className = "", type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition text-white font-semibold ${className}`}
    >
      {children}
    </button>
  );
}