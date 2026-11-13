import {
  ShieldCheck,
  WifiOff,
  UserX,
  Upload,
  Settings2,
  Download,
  ArrowRight,
  FileText,
  Check,
  Zap,
} from 'lucide-react'
import ToolCard from '../components/ToolCard'
import { TOOLS } from '../utils/tools'

const privacyPoints = [
  {
    icon: ShieldCheck,
    title: 'Processed on your device',
    text: 'Conversion runs entirely inside your browser. Your data never leaves your computer.',
    tone: 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/30',
  },
  {
    icon: UserX,
    title: 'No account needed',
    text: 'Skip the friction. No sign-up, no login, and absolutely no subscriptions required.',
    tone: 'bg-sky-400/15 text-sky-300 ring-sky-400/30',
  },
  {
    icon: WifiOff,
    title: 'Nothing is stored',
    text: 'Files are held in memory only while active. Close the browser tab and they vanish permanently.',
    tone: 'bg-violet-400/15 text-violet-300 ring-violet-400/30',
  },
]

const steps = [
  {
    icon: Upload,
    title: 'Choose a file',
    text: 'Pick a specific tool, then drag and drop your file directly into the browser.',
    tone: 'from-indigo-500 to-indigo-600 shadow-indigo-300/50',
  },
  {
    icon: Settings2,
    title: 'Adjust options',
    text: 'Fine-tune quality, output format, page size, or sequence to your exact needs.',
    tone: 'from-violet-500 to-indigo-500 shadow-violet-300/50',
  },
  {
    icon: Download,
    title: 'Download result',
    text: 'Your file is generated instantly in-browser and saved straight to your local drive.',
    tone: 'from-sky-500 to-indigo-500 shadow-sky-300/50',
  },
]

const trustChips = ['Free to use', 'No sign-up', 'Files never uploaded']

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-slate-50 via-indigo-50/40 to-white font-sans text-slate-900">
      {/* ───────────── Hero ───────────── */}
      <section className="relative isolate overflow-hidden pb-16 pt-20 sm:pb-24 sm:pt-28 lg:pt-32">
        {/* dotted grid, fades out toward the bottom */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgb(165 180 252 / 0.55) 1px, transparent 0)',
            backgroundSize: '26px 26px',
          }}
        />
        {/* colour blobs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-indigo-300/40 blur-3xl sm:h-96 sm:w-96"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-10 -z-10 h-72 w-72 rounded-full bg-sky-300/40 blur-3xl sm:h-96 sm:w-96"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-48 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-violet-300/30 blur-3xl"
        />

        <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/70 px-4 py-1.5 text-xs font-medium text-indigo-700 shadow-sm backdrop-blur sm:text-sm">
              <ShieldCheck size={16} className="text-emerald-500" />
              Free · No account · Files stay on your device
            </span>

            <h1 className="mt-7 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
              All Your File Tools in <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-500 bg-clip-text text-transparent">
                One Secure Place
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-xl">
              Convert, compress, and manage your files securely. Blazing fast
              online tools with zero-server processing. No uploads, no waiting,
              no accounts.
            </p>

            <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
              <a
                href="#tools"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-700 hover:to-sky-600 hover:shadow-xl hover:shadow-indigo-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Explore tools
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                />
              </a>
              <a
                href="#how"
                className="inline-flex items-center justify-center rounded-full border border-indigo-200 bg-white/80 px-8 py-3.5 text-sm font-semibold text-indigo-900 shadow-sm backdrop-blur transition hover:border-indigo-300 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                See how it works
              </a>
            </div>

            <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-600">
              {trustChips.map((chip) => (
                <li key={chip} className="flex items-center gap-1.5">
                  <Check size={16} className="text-emerald-500" />
                  {chip}
                </li>
              ))}
            </ul>
          </div>

          {/* Decorative preview card */}
          <div
            aria-hidden="true"
            className="mx-auto mt-14 max-w-2xl rounded-2xl border border-white/80 bg-white/70 p-3 shadow-2xl shadow-indigo-200/60 ring-1 ring-indigo-100 backdrop-blur sm:mt-16 sm:p-4"
          >
            <div className="flex items-center gap-1.5 px-1 pb-3">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              <span className="ml-3 hidden h-5 flex-1 rounded-md bg-slate-100 sm:block" />
            </div>

            <div className="grid items-center gap-3 rounded-xl bg-gradient-to-br from-indigo-50 to-sky-50 p-4 sm:grid-cols-[1fr_auto_1fr] sm:gap-4 sm:p-5">
              <div className="flex items-center gap-3 rounded-xl bg-white p-3 text-left shadow-sm ring-1 ring-slate-100">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                  <FileText size={20} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    annual-report.pdf
                  </p>
                  <p className="text-xs text-slate-500">Your file</p>
                </div>
              </div>

              <span className="mx-auto flex h-9 w-9 rotate-90 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 text-white shadow-md sm:rotate-0">
                <Zap size={16} />
              </span>

              <div className="flex items-center gap-3 rounded-xl bg-white p-3 text-left shadow-sm ring-1 ring-slate-100">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                  <FileText size={20} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    annual-report.docx
                  </p>
                  <p className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <Check size={12} /> Converted in your browser
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Tools ───────────── */}
      <section
        id="tools"
        className="container mx-auto scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Choose your tool
          </h2>
          <p className="mt-3 text-base text-slate-600 sm:text-lg">
            Purpose-built utilities designed to do one thing perfectly.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {TOOLS.map((tool) => (
            <div
              key={tool.id}
              className="rounded-2xl transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-200/60 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <ToolCard tool={tool} />
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── Privacy ───────────── */}
      <section className="container mx-auto px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 px-5 py-14 shadow-2xl shadow-indigo-900/20 sm:rounded-[2.5rem] sm:px-12 sm:py-20 lg:px-20">
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 -z-10 h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 -left-24 -z-10 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl"
          />

          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Your files stay entirely yours
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-slate-300 sm:text-lg">
              FileTools operates locally. We have no servers to receive your
              files, which means absolutely zero risk of your data being
              intercepted, stored, or read.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-2xl gap-5 sm:mt-14 lg:max-w-none lg:grid-cols-3 lg:gap-6">
            {privacyPoints.map(({ icon: Icon, title, text, tone }) => (
              <div
                key={title}
                className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-colors hover:bg-white/10 sm:p-8"
              >
                <div
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${tone}`}
                >
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-semibold text-white sm:text-xl">
                  {title}
                </h3>
                <p className="mt-3 leading-relaxed text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── How it works ───────────── */}
      <section
        id="how"
        className="container mx-auto scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            How it works
          </h2>
          <p className="mt-3 text-base text-slate-600 sm:text-lg">
            Three simple steps to process your files locally and securely.
          </p>
        </div>

        <div className="relative mx-auto max-w-5xl">
          {/* connecting line (desktop) */}
          <div
            aria-hidden="true"
            className="absolute left-[16%] right-[16%] top-8 hidden h-0.5 bg-gradient-to-r from-indigo-200 via-violet-200 to-sky-200 md:block"
          />

          <ol className="grid gap-6 md:grid-cols-3 md:gap-8">
            {steps.map(({ icon: Icon, title, text, tone }, index) => (
              <li
                key={title}
                className="relative flex flex-col items-center rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-sm shadow-slate-200/60 sm:p-8 md:border-0 md:bg-transparent md:p-0 md:shadow-none"
              >
                <div
                  className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-xl ${tone}`}
                >
                  <Icon size={28} />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-indigo-700 shadow ring-1 ring-indigo-100">
                    {index + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900">
                  {title}
                </h3>
                <p className="mt-3 max-w-xs leading-relaxed text-slate-600">
                  {text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────────── Closing call to action ───────────── */}
      <section className="container mx-auto px-4 pb-8 pt-4 sm:px-6 sm:pb-12 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-500 px-6 py-12 text-center shadow-xl shadow-indigo-300/40 sm:px-12 sm:py-16">
          <div
            aria-hidden="true"
            className="absolute -left-10 -top-10 -z-10 h-48 w-48 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-10 -right-10 -z-10 h-56 w-56 rounded-full bg-white/10 blur-2xl"
          />
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to convert your first file?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-indigo-50 sm:text-lg">
            Pick a tool and finish in seconds. Nothing to install and nothing
            to sign up for.
          </p>
          <a
            href="#tools"
            className="group mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-indigo-700 shadow-lg transition hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Choose a tool
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
            />
          </a>
        </div>
      </section>
    </div>
  )
}
