import { useEffect, useState } from "react";

export default function QuizTimer({ duration = 10, onEnd }) {
  const [time, setTime] = useState(duration);

  useEffect(() => {
    setTime(duration);
  }, [duration]);

  useEffect(() => {
    if (time <= 0) {
      onEnd?.();
      return;
    }

    const interval = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          clearInterval(interval);
          onEnd?.();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [time, onEnd]);

  return (
    <div className="text-white text-sm mb-3">
      Tempo: {time}s
    </div>
  );
}