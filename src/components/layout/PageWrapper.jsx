import Navbar from "./Navbar";
import Footer from "./Footer";
import Sidebar from "./Sidebar";

export default function PageWrapper({ children, hideFooter = false }) {
  return (
    <div className="relative h-dvh overflow-hidden text-white">
      <Navbar />
      <Sidebar />

      <main className="relative z-30 h-[calc(100dvh-118px)] overflow-hidden lg:pl-56">
        {children}
      </main>

      {!hideFooter && <Footer />}
    </div>
  );
}
