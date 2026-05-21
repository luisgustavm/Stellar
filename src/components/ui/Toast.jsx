import { useEffect, useState } from "react";

export default function Toast({ message, show, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) return;

    setVisible(true);

    const t = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, 3000);

    return () => clearTimeout(t);
  }, [show, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-5 right-5 bg-black/80 border border-white/10 text-white px-4 py-2 rounded-lg">
      {message}
    </div>
  );
}