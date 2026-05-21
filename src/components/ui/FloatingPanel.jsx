// src/components/ui/FloatingPanel.jsx
export default function FloatingPanel({ children }) {
  return (
    <div className="fixed bottom-6 left-6 bg-black/60 border border-white/10 rounded-xl p-4 backdrop-blur text-white shadow-xl">
      {children}
    </div>
  );
}