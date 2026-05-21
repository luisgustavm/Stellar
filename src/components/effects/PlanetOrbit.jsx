// src/components/effects/PlanetOrbit.jsx
export default function PlanetOrbit({ size = 200, speed = 20, children }) {
  return (
    <div
      className="relative rounded-full border border-white/10 animate-spin"
      style={{
        width: size,
        height: size,
        animationDuration: `${speed}s`,
      }}
    >
      {children}
    </div>
  );
}