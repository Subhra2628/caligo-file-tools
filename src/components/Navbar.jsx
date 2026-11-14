
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  ChevronRight,
  Sparkles,
  Home,
  Check,
} from "lucide-react";

import Logo from "./logo";
import { TOOLS } from "../utils/tools";
import { preloadTool } from "../utils/preloadTools";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu when route changes
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Lock body scroll while mobile menu is open
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (open) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Close menu with Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Desktop navigation styles
  const navClass = ({ isActive }) =>
    `inline-flex shrink-0 items-center justify-center whitespace-nowrap
    rounded-full px-2.5 xl:px-4 py-1.5 xl:py-2
    text-[13px] xl:text-sm font-semibold
    transition-all duration-200
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500
    ${
      isActive
        ? "bg-brand-50 text-brand-700 ring-1 ring-brand-500/20 shadow-sm"
        : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 shadow-sm shadow-slate-900/5 backdrop-blur-xl">

      {/* Navbar */}
      <div className="container-page">
        <div className="flex h-[72px] w-full items-center justify-between gap-2 xl:gap-6">

          {/* Logo */}
          <div className="shrink-0 transition-transform duration-200 hover:scale-105">
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <nav
            className="hidden min-w-0 flex-1 items-center justify-end gap-0.5 xl:gap-1.5 lg:flex"
            aria-label="Main navigation"
          >
            <NavLink to="/" end className={navClass}>
              Home
            </NavLink>

            {TOOLS.map((tool) => (
              <NavLink
                key={tool.id}
                to={tool.path}
                onMouseEnter={() => preloadTool(tool.path)}
                onFocus={() => preloadTool(tool.path)}
                onPointerDown={() => preloadTool(tool.path)}
                className={navClass}
              >
                {tool.name}
              </NavLink>
            ))}
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className={`relative flex h-11 w-11 shrink-0 items-center justify-center
              rounded-xl border transition-all duration-200 lg:hidden
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500
              ${
                open
                  ? "border-brand-200 bg-brand-50 text-brand-700"
                  : "border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
              }`}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          >
            <X
              size={21}
              className={`absolute transition-all duration-200 ${
                open
                  ? "rotate-0 scale-100 opacity-100"
                  : "rotate-90 scale-75 opacity-0"
              }`}
            />

            <Menu
              size={21}
              className={`absolute transition-all duration-200 ${
                open
                  ? "-rotate-90 scale-75 opacity-0"
                  : "rotate-0 scale-100 opacity-100"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {open && (
        <>
          {/* Background Overlay */}
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-[73px] z-40 bg-slate-950/40 backdrop-blur-[3px] lg:hidden"
          />

          {/* Mobile Menu Panel */}
          <div
            id="mobile-menu"
            className="absolute left-0 right-0 top-full z-50 border-t border-slate-100 bg-white shadow-2xl shadow-slate-900/10 animate-in slide-in-from-top-2 fade-in duration-200 lg:hidden"
          >
            <div className="container-page max-h-[calc(100dvh-73px)] overflow-y-auto overscroll-contain px-4 py-5 sm:py-6">

              {/* Menu Header */}
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-slate-900">
                    Explore Caligo
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Your everyday file tools, all in one place.
                  </p>
                </div>

                <div className="flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl border border-brand-100 bg-brand-50 px-3 text-brand-700">
                  <Sparkles size={15} />
                  <span className="text-sm font-bold">
                    {TOOLS.length}
                  </span>
                </div>
              </div>

              {/* Home Link */}
              <NavLink
                to="/"
                end
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `group mb-6 flex items-center justify-between rounded-2xl border p-3.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                    isActive
                      ? "border-brand-200 bg-brand-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-brand-200 hover:bg-slate-50"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors group-hover:bg-brand-100 group-hover:text-brand-700">
                        <Home size={20} />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Home
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          Back to homepage
                        </p>
                      </div>
                    </div>

                    <ChevronRight
                      size={19}
                      className={
                        isActive ? "text-brand-600" : "text-slate-400"
                      }
                    />
                  </>
                )}
              </NavLink>

              {/* Tools Section Heading */}
              <div className="mb-3 flex items-center justify-between px-1">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    File Tools
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Select a tool to continue
                  </p>
                </div>

                <span className="text-xs font-medium text-slate-400">
                  {TOOLS.length} available
                </span>
              </div>

              {/* Tools Grid */}
              <nav
                className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2"
                aria-label="Mobile tool navigation"
              >
                {TOOLS.map((tool) => {
                  const Icon = tool.icon;

                  return (
                    <NavLink
                      key={tool.id}
                      to={tool.path}
                      onMouseEnter={() => preloadTool(tool.path)}
                      onFocus={() => preloadTool(tool.path)}
                      onPointerDown={() => preloadTool(tool.path)}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `group flex min-w-0 items-center gap-3 rounded-2xl border p-3 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                          isActive
                            ? "border-brand-200 bg-brand-50 shadow-sm"
                            : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {/* Tool Icon */}
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tool.iconBg}`}
                          >
                            <Icon
                              size={19}
                              strokeWidth={1.9}
                              className={tool.iconColor}
                            />
                          </div>

                          {/* Tool Name and Formats */}
                          <div className="min-w-0 flex-1">
                            <p
                              className={`truncate text-sm font-semibold ${
                                isActive
                                  ? "text-brand-700"
                                  : "text-slate-800"
                              }`}
                            >
                              {tool.name}
                            </p>

                            <p className="mt-1 truncate text-[11px] text-slate-400">
                              {tool.formats}
                            </p>
                          </div>

                          {/* Active Indicator */}
                          {isActive ? (
                            <Check
                              size={17}
                              className="shrink-0 text-brand-600"
                            />
                          ) : (
                            <ChevronRight
                              size={16}
                              className="shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
                            />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>

              {/* Bottom Brand Card */}
              <div className="relative mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5">

                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-brand-500/20 blur-2xl" />

                <div className="relative flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white">
                      Simple. Fast. Secure.
                    </p>

                    <p className="mt-1 max-w-[220px] text-xs leading-5 text-slate-300">
                      Everything you need to manage your files in one place.
                    </p>
                  </div>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white">
                    <Sparkles size={21} />
                  </div>
                </div>
              </div>

              {/* Bottom Note */}
              <p className="mt-4 pb-1 text-center text-[11px] text-slate-400">
                Made for simple and effortless file management.
              </p>

            </div>
          </div>
        </>
      )}
    </header>
  );
}
