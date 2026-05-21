// src/components/ui/Card.jsx
export default function Card({ children, className = "" }) {
  return (
    <div className={`bg-white/10 backdrop-blur border border-white/10 rounded-xl p-4 shadow-lg ${className}`}>
      {children}
    </div>
  );
}