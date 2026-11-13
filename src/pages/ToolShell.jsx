import { Hammer } from 'lucide-react'
import { getTool } from '../utils/tools'

export default function ToolShell({ toolId }) {
  const tool = getTool(toolId)
  const Icon = tool.icon

  return (
    <div className="container-page py-12">
      <div className="flex items-center gap-4">
        <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${tool.iconBg} ${tool.iconColor}`}>
          <Icon size={28} />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{tool.name}</h1>
          <p className="text-slate-600">{tool.description}</p>
        </div>
      </div>

      <div className="card mt-8 flex flex-col items-center py-16 text-center">
        <Hammer className="text-slate-400" size={32} />
        <h2 className="mt-4 text-lg font-semibold">This tool is not built yet</h2>
        <p className="mt-1 max-w-md text-sm text-slate-600">
          It will be built in Phase {tool.phase}. Supported formats: {tool.formats}.
        </p>
      </div>
    </div>
  )
}
