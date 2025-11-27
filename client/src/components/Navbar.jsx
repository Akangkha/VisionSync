import { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const linkBase =
    "text-sm md:text-[15px] font-medium transition-colors duration-150 text-blue-100 hover:text-white";

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    setOpen(false);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#021a40]/95 backdrop-blur">
      <nav className="max-w-6xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
        <Link
          to="/welcome"
          className="flex items-center gap-2 group select-none"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
            <span className="text-white text-xl">👁️</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm md:text-base font-semibold text-white">
              Gaze Maze
            </span>
            <span className="text-[10px] md:text-[11px] text-blue-200 uppercase tracking-[0.2em]">
              Vision Therapy
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <button
            type="button"
            className={linkBase}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Home
          </button>

          <button
            type="button"
            className={linkBase}
            onClick={() => scrollToSection("how-it-works")}
          >
            How it Works
          </button>

          <button
            type="button"
            className={linkBase}
            onClick={() => scrollToSection("who-it-helps")}
          >
            Who it Helps
          </button>

          <button
            type="button"
            className={linkBase}
            onClick={() => scrollToSection("features")}
          >
            Features
          </button>

          <Link
            to="/playground"
            className="ml-4 inline-flex items-center gap-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 shadow-md transition-transform duration-150 hover:-translate-y-[1px]"
          >
            Start Session
            <span aria-hidden>🎮</span>
          </Link>
        </div>

        {/* Mobile menu*/}
        <button
          className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-500 text-white shadow-md"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle navigation"
        >
          {open ? (
            <span className="text-lg">✕</span>
          ) : (
            <span className="text-lg">☰</span>
          )}
        </button>
      </nav>

      {/* Mobile*/}
      {open && (
        <div className="md:hidden bg-[#021a40] border-t border-blue-900/60">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2">
            <button
              type="button"
              className={linkBase}
              onClick={() => {
                setOpen(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Home
            </button>

            <button
              type="button"
              className={linkBase}
              onClick={() => scrollToSection("how-it-works")}
            >
              How it Works
            </button>

            <button
              type="button"
              className={linkBase}
              onClick={() => scrollToSection("who-it-helps")}
            >
              Who it Helps
            </button>

            <button
              type="button"
              className={linkBase}
              onClick={() => scrollToSection("features")}
            >
              Features
            </button>

            <Link
              to="/playground"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 shadow-md"
            >
              Start Session!
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
