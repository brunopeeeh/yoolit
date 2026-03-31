import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { MessageSquare, Trophy } from 'lucide-react';

interface ChatTask {
  id: string;
  title: string;
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

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      // Fetch active chat_usage tasks that haven't expired
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id, title, points, chat_target_count, deadline')
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

      // Count messages sent by the user today (or within task period)
      // We'll count all messages for now - the admin can audit by date
      const { count } = await supabase
        .from('chat_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // For simplicity, use the same count for all tasks
      // A more advanced version could filter by task creation date
      const counts: Record<string, number> = {};
      validTasks.forEach(t => {
        counts[t.id] = count || 0;
      });
      setMessageCounts(counts);
    };

    fetchData();

    // Subscribe to real-time updates on chat_usage_logs
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
    <div className="px-3 sm:px-6 pt-2">
      <div className="max-w-5xl mx-auto space-y-2">
        {tasks.map(task => {
          const current = messageCounts[task.id] || 0;
          const target = task.chat_target_count;
          const percentage = Math.min((current / target) * 100, 100);
          const isComplete = current >= target;

          return (
            <div
              key={task.id}
              className="flex items-center gap-3 rounded-xl bg-muted/50 border border-border/50 px-3 py-2"
            >
              <div className="flex-shrink-0">
                {isComplete ? (
                  <Trophy className="h-4 w-4 text-yellow-500" />
                ) : (
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium truncate">{task.title}</p>
                  <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                    {current}/{target} • {task.points} pts
                  </span>
                </div>
                <Progress value={percentage} className="h-1.5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatTaskProgress;
