"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { StickyBanner } from "@/components/ui/sticky-banner";

// Only load PerformanceMonitor in development
const PerformanceMonitor = dynamic(() => import("./PerformanceMonitor"), {
  ssr: false,
});

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  
  // Pages that should NOT have navbar and sticky banner
  const pagesWithoutNavbar = ['/login', '/dashboard', '/docs'];
  const shouldShowNavbar = !pagesWithoutNavbar.includes(pathname);
  
  // Pages that should NOT have footer
  const pagesWithoutFooter = ['/login', '/dashboard', '/docs', '/playground'];
  const shouldShowFooter = !pagesWithoutFooter.includes(pathname);

  if (!shouldShowNavbar) {
    // For pages like login, render without navbar and banner
    return <>{children}</>;
  }

  // For pages like home, render with navbar and banner
  return (
    <>
      <StickyBanner className="bg-[#FF5F55] z-[60]">
        <p className="text-white text-sm font-medium text-center">
          We are currently keeping waitlist & would be opening to all users soon
        </p>
      </StickyBanner>
      <Navbar />
      <div>
        {children}
        {shouldShowFooter && <Footer />}
      </div>
      {process.env.NODE_ENV === 'development' && <PerformanceMonitor />}
    </>
  );
}
