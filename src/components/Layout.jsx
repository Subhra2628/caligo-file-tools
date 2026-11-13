
import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

import Navbar from "./navbar";
import Footer from "./Footer";

// Scroll to top whenever the route changes.
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [pathname]);

  return null;
}

// Loading fallback for lazy-loaded pages.
function PageLoader() {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2
          className="h-9 w-9 animate-spin text-blue-600"
          aria-hidden="true"
        />

        <p className="text-sm font-medium text-slate-500">
          Loading page...
        </p>
      </div>

      <span className="sr-only">Please wait while the page loads.</span>
    </div>
  );
}

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <ScrollToTop />

      <Navbar />

      <main
        id="main-content"
        className="flex-1"
        tabIndex="-1"
      >
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
