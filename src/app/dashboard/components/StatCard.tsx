import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  trend?: string
  trendColor?: string
  description?: string
}

export function StatCard({ label, value, icon: Icon, trend, trendColor, description }: StatCardProps) {
  return (
    <Card className="bg-zinc-900/80 border-zinc-800 shadow-lg shadow-black/30 hover:border-zinc-700 transition-colors">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium">{label}</p>
          {Icon && <Icon className="w-4 h-4 text-zinc-600" />}
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
          {trend && (
            <span className={`text-xs font-semibold ${trendColor || 'text-orange-400'}`}>
              {trend}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-zinc-500 mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
