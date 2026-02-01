interface StatsCardProps {
  title: string;
  value: number;
  description?: string;
}

export function StatsCard({ title, value, description }: StatsCardProps) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="text-3xl font-bold text-slate-900">{value}</div>
      <div className="text-sm font-medium text-slate-600">{title}</div>
      {description && (
        <div className="mt-1 text-xs text-slate-500">{description}</div>
      )}
    </div>
  );
}