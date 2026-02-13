import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NewFamilyButton } from '@/components/families/NewFamilyButton';
import { ActiveCheckInsTable } from '@/components/checkins/ActiveCheckInsTable';

export function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <div className="flex items-center gap-3">
          <NewFamilyButton />
          <Button onClick={() => navigate('/checkins/new')} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Manual Check In
          </Button>
        </div>
      </div>

      <ActiveCheckInsTable limit={10} showViewAll={true} showActions={true} />
    </div>
  );
}
