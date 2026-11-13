
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

export default function Logo({ className = "" }) {
  return (
    <Link
      to="/"
      aria-label="FileTools - Go to homepage"
      className={`group inline-flex w-fit items-center gap-2.5 rounded-lg outline-none transition-opacity duration-200 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-4 ${className}`}
    >
      {/* Logo Icon */}
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft transition-transform duration-300 group-hover:scale-105">
        <FileText
          size={21}
          strokeWidth={2.2}
          aria-hidden="true"
        />
      </span>

      {/* Brand Name */}
      <span className="whitespace-nowrap text-xl font-extrabold tracking-tight text-slate-900">
        Cali
        <span className="text-brand-600">go</span>
      </span>
    </Link>
  );
}
