import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import BottomNav from "@/components/BottomNav";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
};

const SiteLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1 pb-24 md:pb-28">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default SiteLayout;
