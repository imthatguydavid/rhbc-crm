import type { CheckIn } from '@rhbc-crm/shared';

interface CheckInCardProps {
  checkIn: CheckIn & { childName?: string; familyName?: string };
}

export function CheckInCard({ checkIn }: CheckInCardProps) {
  const checkInTime = new Date(checkIn.checkInTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h4 className="font-semibold text-slate-900">{checkIn.childName || 'Unknown'}</h4>
          <p className="text-sm text-slate-600">{checkIn.familyName || 'Unknown Family'}</p>
        </div>
        <span className="text-xs text-slate-500">{checkInTime}</span>
      </div>
      <div className="mt-2">
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
          {checkIn.room}
        </span>
      </div>
    </div>
  );
}
