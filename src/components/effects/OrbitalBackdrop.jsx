export default function OrbitalBackdrop() {
  return (
    <div className="orbital-backdrop" aria-hidden="true">
      <span className="orbit-ring orbit-ring-large">
        <span className="orbit-planet orbit-planet-cyan" />
      </span>
      <span className="orbit-ring orbit-ring-medium">
        <span className="orbit-planet orbit-planet-gold" />
      </span>
      <span className="orbit-ring orbit-ring-small">
        <span className="orbit-planet orbit-planet-violet" />
      </span>
    </div>
  );
}
