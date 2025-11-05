import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

interface AgentShift {
  name: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'busy' | 'break' | 'offline';
}

const statusColors = {
  available: 'bg-emerald-500',
  busy: 'bg-rose-500',
  break: 'bg-amber-500',
  offline: 'bg-cyan-500',
};

const timeToPosition = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 60 + minutes) / (24 * 60) * 100;
};

const AgentRow = ({ agent }: { agent: AgentShift }) => {
  const startPos = timeToPosition(agent.startTime);
  const endPos = timeToPosition(agent.endTime);
  const width = endPos - startPos;

  return (
    <div className="flex items-center gap-4 py-2 border-b border-border last:border-0">
      <div className="w-40 text-sm text-muted-foreground text-right flex-shrink-0">
        {agent.name}
      </div>
      <div className="flex-1 relative h-8 bg-muted/30 rounded">
        <div
          className={`absolute h-full rounded ${statusColors[agent.status]}`}
          style={{
            left: `${startPos}%`,
            width: `${width}%`,
          }}
        />
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

export const AgentScheduleChart = ({ shifts }: { shifts: AgentShift[] }) => {
  const [selectedShift, setSelectedShift] = useState('all');

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
            <div className="space-y-0">
              {shifts.map((agent, index) => (
                <AgentRow key={index} agent={agent} />
              ))}
            </div>
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
