export default function Enemy({ x, y }) {
  return (
    <div
      className="absolute w-10 h-10 bg-red-500"
      style={{ left: x, top: y }}
    />
  );
}