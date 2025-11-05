import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface StatusChange {
  id: string;
  user_id: string;
  old_status: string | null;
  new_status: string;
  created_at: string;
  changed_by: string;
}

interface AgentShift {
  id: string;
  name: string;
  email: string;
  currentStatus: 'available' | 'busy' | 'break' | 'offline';
  statusHistory: StatusChange[];
}

const statusColors: Record<string, string> = {
  available: 'bg-emerald-500',
  busy: 'bg-rose-500',
  break: 'bg-amber-500',
  offline: 'bg-slate-500',
};

const timeToPosition = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 60 + minutes) / (24 * 60) * 100;
};

const AgentRow = ({ agent }: { agent: AgentShift }) => {
  // Get today's status changes sorted by time
  const todayChanges = agent.statusHistory
    .filter(change => {
      const changeDate = new Date(change.created_at);
      const today = new Date();
      return changeDate.toDateString() === today.toDateString();
    })
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // Build status segments throughout the day
  const segments: Array<{ status: string; startPos: number; endPos: number }> = [];
  
  if (todayChanges.length === 0) {
    // No changes today, show current status for entire day
    segments.push({
      status: agent.currentStatus,
      startPos: 0,
      endPos: 100,
    });
  } else {
    // Start with first status (from midnight to first change)
    const firstChange = todayChanges[0];
    const firstChangeTime = new Date(firstChange.created_at);
    const firstPos = timeToPosition(`${firstChangeTime.getHours()}:${firstChangeTime.getMinutes()}`);
    
    if (firstPos > 0 && firstChange.old_status) {
      segments.push({
        status: firstChange.old_status,
        startPos: 0,
        endPos: firstPos,
      });
    }

    // Add segments for each status change
    for (let i = 0; i < todayChanges.length; i++) {
      const change = todayChanges[i];
      const changeTime = new Date(change.created_at);
      const startPos = timeToPosition(`${changeTime.getHours()}:${changeTime.getMinutes()}`);
      
      let endPos = 100;
      if (i < todayChanges.length - 1) {
        const nextChange = todayChanges[i + 1];
        const nextTime = new Date(nextChange.created_at);
        endPos = timeToPosition(`${nextTime.getHours()}:${nextTime.getMinutes()}`);
      }

      segments.push({
        status: change.new_status,
        startPos,
        endPos,
      });
    }
  }

  return (
    <div className="flex items-center gap-4 py-2 border-b border-border last:border-0">
      <div className="w-40 text-sm text-muted-foreground text-right flex-shrink-0">
        <div className="font-medium">{agent.name}</div>
      </div>
      <div className="flex-1 relative h-8 bg-muted/30 rounded overflow-hidden">
        {segments.map((segment, index) => (
          <div
            key={index}
            className={`absolute h-full ${statusColors[segment.status] || 'bg-slate-500'} transition-all`}
            style={{
              left: `${segment.startPos}%`,
              width: `${segment.endPos - segment.startPos}%`,
            }}
            title={`${segment.status} - ${format(new Date(), 'HH:mm')}`}
          />
        ))}
        {/* Status change markers */}
        {todayChanges.map((change, index) => {
          const changeTime = new Date(change.created_at);
          const pos = timeToPosition(`${changeTime.getHours()}:${changeTime.getMinutes()}`);
          return (
            <div
              key={change.id}
              className="absolute top-0 bottom-0 w-0.5 bg-background z-10"
              style={{ left: `${pos}%` }}
              title={`${format(changeTime, 'HH:mm')} - ${change.old_status} → ${change.new_status}`}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-background border border-foreground rounded-full" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TimeAxis = () => {
  const hours = Array.from({ length: 13 }, (_, i) => i * 2);
  
  return (
    <div className="flex items-center gap-4 mb-2">
      <div className="w-40 flex-shrink-0" />
      <div className="flex-1 relative h-8">
        {hours.map((hour) => (
          <div
            key={hour}
            className="absolute text-xs text-muted-foreground"
            style={{ left: `${(hour / 24) * 100}%` }}
          >
            {hour.toString().padStart(2, '0')}:00
          </div>
        ))}
      </div>
    </div>
  );
};

const CurrentTimeLine = () => {
  const now = new Date();
  const currentPos = (now.getHours() * 60 + now.getMinutes()) / (24 * 60) * 100;

  return (
    <div className="flex items-center gap-4 absolute inset-0 pointer-events-none">
      <div className="w-40 flex-shrink-0" />
      <div className="flex-1 relative h-full">
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-rose-500"
          style={{ left: `${currentPos}%` }}
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-rose-500 font-medium whitespace-nowrap">
            Agora
          </div>
        </div>
      </div>
    </div>
  );
};

export const AgentScheduleChart = () => {
  const [selectedShift, setSelectedShift] = useState('all');
  const [agents, setAgents] = useState<AgentShift[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAgentData();
  }, []);

  const fetchAgentData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, status')
        .order('name');

      if (profilesError) throw profilesError;

      // Fetch today's status changes for all users
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: statusChanges, error: changesError } = await supabase
        .from('status_changes')
        .select('*')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: true });

      if (changesError) throw changesError;

      // Map profiles to AgentShift with their status history
      const agentData: AgentShift[] = (profiles || []).map(profile => ({
        id: profile.id,
        name: profile.name || 'Sem nome',
        email: profile.email || '',
        currentStatus: (profile.status as any) || 'offline',
        statusHistory: (statusChanges || []).filter(change => change.user_id === profile.id),
      }));

      setAgents(agentData);
    } catch (error) {
      console.error('Error fetching agent data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Escala de Agentes - Hoje</CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Escala de Agentes - Hoje</CardTitle>
            <CardDescription>Visualização dos horários de trabalho dos agentes</CardDescription>
          </div>
          <Select value={selectedShift} onValueChange={setSelectedShift}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione o turno" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os turnos</SelectItem>
              <SelectItem value="morning">Manhã</SelectItem>
              <SelectItem value="afternoon">Tarde</SelectItem>
              <SelectItem value="night">Noite</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <TimeAxis />
          <div className="relative">
            {agents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum agente encontrado
              </div>
            ) : (
              <div className="space-y-0">
                {agents.map((agent) => (
                  <AgentRow key={agent.id} agent={agent} />
                ))}
              </div>
            )}
            <CurrentTimeLine />
          </div>
          <div className="flex items-center gap-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500" />
              <span className="text-sm text-muted-foreground">Disponível</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-rose-500" />
              <span className="text-sm text-muted-foreground">Ocupado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500" />
              <span className="text-sm text-muted-foreground">Pausa</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-cyan-500" />
              <span className="text-sm text-muted-foreground">Offline</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
