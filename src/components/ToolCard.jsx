import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function ToolCard({ tool }) {
  const Icon = tool.icon

  return (
    <Link
      to={tool.path}
      className="card group flex flex-col transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift"
    >
      <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${tool.iconBg} ${tool.iconColor}`}>
        <Icon size={24} />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{tool.name}</h3>
      <p className="mt-1 flex-1 text-sm text-slate-600">{tool.description}</p>
      <div className="mt-5 flex items-center justify-between text-sm">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {tool.formats}
        </span>
        <span className="flex items-center gap-1 font-semibold text-brand-600">
          Open <ArrowRight size={16} className="transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  )
}
