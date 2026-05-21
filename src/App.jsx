import AppRoutes from "./routes/AppRoutes";
import StarsBackground from "./components/effects/StarsBackground";
import OrbitalBackdrop from "./components/effects/OrbitalBackdrop";
import EquippedBackground from "./components/effects/EquippedBackground";
import { ToastProvider } from "./context/ToastContext";

export default function App() {
  return (
    <ToastProvider>
      <div className="stellar-app-shell relative isolate h-dvh overflow-hidden text-white font-orbitron">
        <main className="relative z-20 h-dvh overflow-hidden">
          <AppRoutes />
        </main>
        <EquippedBackground />
        <OrbitalBackdrop />
        <StarsBackground />
      </div>
    </ToastProvider>
  );
}
