import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { MessageSquare, Trophy, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface ChatTask {
  id: string;
  title: string;
  description: string | null;
  completion_rules: string | null;
  points: number;
  chat_target_count: number;
  deadline: string;
}

interface ChatTaskProgressProps {
  userId?: string;
}

const ChatTaskProgress = ({ userId }: ChatTaskProgressProps) => {
  const [tasks, setTasks] = useState<ChatTask[]>([]);
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>({});
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id, title, description, completion_rules, points, chat_target_count, deadline')
        .eq('is_active', true)
        .eq('task_type', 'chat_usage')
        .gte('deadline', new Date().toISOString())
        .order('deadline', { ascending: true });

      if (!tasksData || tasksData.length === 0) {
        setTasks([]);
        return;
      }

      const validTasks = (tasksData as any[]).filter(t => t.chat_target_count && t.chat_target_count > 0);
      setTasks(validTasks);

      const { count } = await supabase
        .from('chat_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const counts: Record<string, number> = {};
      validTasks.forEach(t => {
        counts[t.id] = count || 0;
      });
      setMessageCounts(counts);
    };

    fetchData();

    const channel = supabase
      .channel('chat-usage-progress')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_usage_logs',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (tasks.length === 0) return null;

  return (
    <div className="px-3 sm:px-6 pt-2 animate-fade-in">
      <div className="max-w-5xl mx-auto space-y-2">
        {tasks.map(task => {
          const current = messageCounts[task.id] || 0;
          const target = task.chat_target_count;
          const percentage = Math.min((current / target) * 100, 100);
          const isComplete = current >= target;
          const isExpanded = expandedTask === task.id;
          const hasRules = task.completion_rules || task.description;

          return (
            <div
              key={task.id}
              className={`rounded-xl border transition-all duration-300 ${
                isComplete
                  ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/50'
                  : 'bg-muted/50 border-border/50'
              }`}
            >
              {/* Main progress row */}
              <div
                className={`flex items-center gap-3 px-3 py-2 ${hasRules ? 'cursor-pointer' : ''}`}
                onClick={() => hasRules && setExpandedTask(isExpanded ? null : task.id)}
              >
                <div className="flex-shrink-0">
                  {isComplete ? (
                    <div className="relative">
                      <Trophy className="h-4 w-4 text-yellow-500 animate-scale-in" />
                    </div>
                  ) : (
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="text-xs font-medium truncate">{task.title}</p>
                      {hasRules && (
                        <Info className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {current}/{target} • {task.points} pts
                      </span>
                      {hasRules && (
                        isExpanded
                          ? <ChevronUp className="h-3 w-3 text-muted-foreground" />
                          : <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <Progress
                    value={percentage}
                    className={`h-1.5 transition-all duration-500 ${
                      isComplete ? '[&>div]:bg-green-500' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Expanded rules section */}
              {isExpanded && hasRules && (
                <div className="px-3 pb-2.5 pt-0 animate-fade-in">
                  <div className="ml-7 p-2 rounded-lg bg-background/80 border border-border/30 text-xs text-muted-foreground space-y-1">
                    {task.description && (
                      <p>{task.description}</p>
                    )}
                    {task.completion_rules && (
                      <div>
                        <span className="font-medium text-foreground/70">Regras: </span>
                        {task.completion_rules}
                      </div>
                    )}
                    <p className="text-[10px] opacity-70">
                      Prazo: {new Date(task.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatTaskProgress;
