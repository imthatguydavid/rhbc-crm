import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActiveCheckInsTable } from '@/components/checkins/ActiveCheckInsTable';
import { HistoryCheckInsTable } from '@/components/checkins/HistoryCheckInsTable';

export function CheckInsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'active';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Check Ins</h1>
        <Button onClick={() => navigate('/checkins/new')} className="gap-2">
          <Plus className="h-4 w-4" />
          Check In Child
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <ActiveCheckInsTable showActions={true} pageSize={10} />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <HistoryCheckInsTable pageSize={10} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
