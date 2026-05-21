export default function Footer() {
  return (
    <footer className="w-full bg-black/60 border-t border-white/10 text-white text-center p-6">
      <p className="text-sm opacity-70">
        © {new Date().getFullYear()} Stellar Interaction • Explore o universo
      </p>
    </footer>
  );
}