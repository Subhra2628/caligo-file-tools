import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  MapPin,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Phone,
  ExternalLink,
  Maximize2,
  Minimize2,
} from "lucide-react";

import Logo from "./logo";
import { TOOLS } from "../utils/tools";

const EMAIL = "subhra2628@gmail.com";
const PHONE_DISPLAY = "+91 7547972652";
const PHONE_LINK = "+917547972652";

/*
  Messages are delivered to EMAIL through FormSubmit (no backend needed).
  First time only: send one test message, then open the activation email
  FormSubmit sends to EMAIL and click "Activate".
  You can swap this for your own endpoint later via VITE_CONTACT_ENDPOINT.
*/
const CONTACT_ENDPOINT =
  import.meta.env?.VITE_CONTACT_ENDPOINT ||
  `https://formsubmit.co/ajax/${EMAIL}`;

// Mangolkote, West Bengal 713143
const ADDRESS_TEXT = "Mangolkote, Purba Bardhaman, West Bengal 713143";
const MAP_EMBED_URL =
  "https://www.google.com/maps?q=23.5268108,87.9938064&z=16&output=embed";
const MAP_OPEN_URL =
  "https://www.google.com/maps/place/Mangolkote,+West+Bengal+713143,+India/@23.5268133,87.9925163,18z";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const fieldClass =
  "w-full rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-2.5 text-sm text-slate-800 " +
  "placeholder:text-slate-400 outline-none transition " +
  "hover:border-indigo-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/15 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const cardClass =
  "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6";

const linkClass =
  "text-sm text-slate-600 transition-colors hover:text-indigo-600 focus-visible:text-indigo-600 " +
  "focus-visible:outline-none focus-visible:underline";

function ContactRow({ icon, tone, href, external, children }) {
  return (
    <li>
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="group flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition group-hover:scale-105 ${tone}`}
        >
          {icon}
        </span>
        <span className="min-w-0 break-words text-sm font-medium text-slate-700 transition-colors group-hover:text-indigo-600">
          {children}
        </span>
      </a>
    </li>
  );
}

export default function Footer() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [honey, setHoney] = useState(""); // spam trap, must stay empty
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [mapHover, setMapHover] = useState(false); // hover expands the map
  const [mapPinned, setMapPinned] = useState(false); // click/tap keeps it expanded
  const mapOpen = mapHover || mapPinned;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (status) setStatus("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
    };

    if (!payload.name || !payload.email || !payload.message) {
      setStatus("Please complete all fields.");
      return;
    }

    if (!EMAIL_REGEX.test(payload.email)) {
      setStatus("Please enter a valid email address.");
      return;
    }

    // Bots fill hidden fields; pretend success and stop.
    if (honey) {
      setStatus("success");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const response = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          ...payload,
          _subject: `FileTools message from ${payload.name}`,
          _replyto: payload.email, // pressing Reply answers the visitor
          _template: "table",
          _captcha: "false",
          _autoresponse:
            "Thanks for contacting FileTools. We received your message and will reply soon.",
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === "false" || data.success === false) {
        throw new Error(
          data.message || "Unable to send your message. Please try again."
        );
      }

      setStatus("success");
      setForm({ name: "", email: "", message: "" });
    } catch (error) {
      setStatus(
        error instanceof TypeError
          ? "Network error. Check your connection and try again."
          : error.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-indigo-100 bg-gradient-to-b from-slate-50 via-indigo-50/50 to-sky-50/60">
      {/* soft decorative glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-indigo-200/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-24 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl"
      />

      <div className="container-page relative px-5 py-12 sm:px-8 sm:py-14 lg:px-16">
        {/* Section heading */}
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Questions or ideas? Get in touch
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            Tell us about a problem with a tool, or a file tool you want us to
            build next. Send a message and we will reply by email.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-12 lg:gap-6">
          {/* 1. Brand */}
          <div className={`${cardClass} sm:col-span-2 lg:col-span-3`}>
            <Logo />

            <p className="mt-4 text-sm leading-7 text-slate-600">
              Free file tools that run in your browser. No account, no
              unnecessary uploads. Simple, fast and secure document conversion.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <ShieldCheck size={15} />
              Privacy-focused tools
            </div>
          </div>

          {/* 2. Tools */}
          <nav aria-label="Tools" className={`${cardClass} lg:col-span-2`}>
            <h3 className="text-sm font-bold text-slate-900">Explore Tools</h3>
            <ul className="mt-5 space-y-3">
              {TOOLS.map((tool) => (
                <li key={tool.id}>
                  <Link to={tool.path} className={linkClass}>
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* 3. Contact */}
          <div className={`${cardClass} lg:col-span-3`}>
            <h3 className="text-sm font-bold text-slate-900">
              Contact Information
            </h3>

    <img
      src="/Passport.jpeg"
      alt="Subhradip"
      className="h-14 w-14 shrink-0 rounded-full border-2 border-slate-200 object-cover"
      width="56"
      height="56"
      loading="lazy"
    />


      <h4 className="text-sm font-semibold text-slate-900">
        Subhradip Ghosh
      </h4>
      <p className="text-xs text-slate-500">
        Creator of Caligo
      </p>

            <ul className="mt-5 space-y-4">
              <ContactRow
                href={`mailto:${EMAIL}`}
                tone="bg-sky-100 text-sky-600"
                icon={<Mail size={16} />}
              >
                {EMAIL}
              </ContactRow>

              <ContactRow
                href={`tel:${PHONE_LINK}`}
                tone="bg-indigo-100 text-indigo-600"
                icon={<Phone size={16} />}
              >
                {PHONE_DISPLAY}
              </ContactRow>

              <ContactRow
                href={`https://wa.me/${PHONE_LINK.replace("+", "")}`}
                external
                tone="bg-emerald-100 text-emerald-600"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                }
              >
                WhatsApp: {PHONE_DISPLAY}
              </ContactRow>

              <ContactRow
                href="https://www.linkedin.com/in/subhradip-ghosh-india/"
                external
                tone="bg-blue-100 text-blue-600"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect width="4" height="12" x="2" y="9" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                }
              >
                LinkedIn
              </ContactRow>

              <ContactRow
                href={MAP_OPEN_URL}
                external
                tone="bg-rose-100 text-rose-600"
                icon={<MapPin size={16} />}
              >
                {ADDRESS_TEXT}
              </ContactRow>
            </ul>
          </div>

          {/* 4. Form */}
          <div className={`${cardClass} sm:col-span-2 lg:col-span-4`}>
            <h3 className="text-sm font-bold text-slate-900">Send a Message</h3>
            <p className="mt-1 text-xs text-slate-500">
              Enter your email and message. We will reply to that address.
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-3">
              {/* honeypot: hidden from people, visible to bots */}
              <input
                type="text"
                name="_honey"
                value={honey}
                onChange={(e) => setHoney(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="footer-name" className="sr-only">
                    Your name
                  </label>
                  <input
                    id="footer-name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    maxLength={100}
                    required
                    disabled={loading}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label htmlFor="footer-email" className="sr-only">
                    Your email
                  </label>
                  <input
                    id="footer-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Your email"
                    maxLength={254}
                    required
                    disabled={loading}
                    className={fieldClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="footer-message" className="sr-only">
                  Your message
                </label>
                <textarea
                  id="footer-message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Write your message..."
                  rows={4}
                  maxLength={3000}
                  required
                  disabled={loading}
                  className={`${fieldClass} resize-none`}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-sky-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Message
                  </>
                )}
              </button>

              <div aria-live="polite" className="min-h-[1.25rem]">
                {status === "success" && (
                  <p className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                    <CheckCircle size={16} />
                    Message sent! We will reply to your email soon.
                  </p>
                )}

                {status && status !== "success" && (
                  <p className="flex items-center gap-2 text-sm font-medium text-red-600">
                    <AlertCircle size={16} />
                    {status}
                  </p>
                )}
              </div>
            </form>

            {/* Interactive map under the form: small by default, grows on hover/tap */}
            <div className="mt-5 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between gap-2">
                <p className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <MapPin size={14} className="shrink-0 text-rose-500" />
                  <span className="truncate">{ADDRESS_TEXT}</span>
                </p>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setMapPinned((v) => !v)}
                    aria-expanded={mapPinned}
                    aria-label={mapPinned ? "Collapse map" : "Expand map"}
                    className="rounded-md p-1 text-indigo-600 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    {mapPinned ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  </button>
                  <a
                    href={MAP_OPEN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open in Google Maps in a new tab"
                    className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              <div
                onMouseEnter={() => setMapHover(true)}
                onMouseLeave={() => setMapHover(false)}
                className={`relative mt-2 overflow-hidden rounded-xl border bg-slate-100 transition-all duration-300 ease-out ${
                  mapOpen
                    ? "h-72 border-indigo-300 shadow-lg shadow-indigo-200/50 sm:h-80"
                    : "h-32 border-slate-200"
                }`}
              >
                <iframe
                  title="Map of Mangolkote, West Bengal 713143"
                  src={MAP_EMBED_URL}
                  className="h-full w-full"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />

                {/* Collapsed state: catches hover/tap so the page can still scroll past the map */}
                {!mapOpen && (
                  <button
                    type="button"
                    onClick={() => setMapPinned(true)}
                    aria-label="Expand map to explore"
                    className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-slate-900/30 to-transparent pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
                  >
                    <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-indigo-700 shadow">
                      Hover or tap to explore map
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="relative border-t border-indigo-100 bg-white/70 px-5 backdrop-blur sm:px-8 lg:px-16">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Calligo. All rights reserved.
          </p>
          <p className="text-xs text-slate-500">Made with care for everyone.</p>
        </div>
      </div>
    </footer>
  );
}
