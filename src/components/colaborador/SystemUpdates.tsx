import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Zap, Bug, Info, Paperclip, CheckCheck, SlidersHorizontal,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const LS_KEY = 'oraculo_updates_read';

interface SystemUpdate {
  id: string;
  title: string | null;
  ai_summary: string | null;
  category: string | null;
  attachments: any | null;
  slack_ts: string | null;
  author_name: string | null;
  created_at: string;
}

type CategoryFilter = 'all' | 'feature' | 'bugfix' | 'aviso';

interface SystemUpdatesProps {
  /** Chamado após todas as atualizações serem marcadas como lidas. */
  onReadAll?: () => void;
}

function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  localStorage.setItem(LS_KEY, JSON.stringify([...ids]));
}

export function SystemUpdates({ onReadAll }: SystemUpdatesProps) {
  const [updates, setUpdates] = useState<SystemUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const hasInitialized = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUpdates();

    const channel = supabase
      .channel('system-updates-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_updates' },
        () => fetchUpdates()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Compute unread on first load + schedule mark-as-read after 3s
  useEffect(() => {
    if (updates.length === 0 || hasInitialized.current) return;
    hasInitialized.current = true;

    const readSet = getReadIds();
    const unread = new Set(updates.filter(u => !readSet.has(u.id)).map(u => u.id));
    setUnreadIds(unread);

    if (unread.size === 0) return;

    const timer = setTimeout(() => {
      const newReadSet = new Set([...getReadIds(), ...updates.map(u => u.id)]);
      saveReadIds(newReadSet);
      onReadAll?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [updates, onReadAll]);

  const fetchUpdates = async () => {
    try {
      const { data, error } = await supabase
        .from('system_updates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUpdates(data || []);
    } catch (error: any) {
      console.error('Error fetching system updates:', error);
      toast({
        title: 'Erro ao carregar atualizações',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markOneAsRead = (id: string) => {
    setUnreadIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      const readSet = getReadIds();
      readSet.add(id);
      saveReadIds(readSet);
      if (next.size === 0) onReadAll?.();
      return next;
    });
  };

  const markAllAsRead = () => {
    const allIds = new Set(updates.map(u => u.id));
    saveReadIds(allIds);
    setUnreadIds(new Set());
    onReadAll?.();
    toast({ title: 'Todas marcadas como lidas ✓' });
  };

  // ── Derived counts ──────────────────────────────────────────────
  const countBy = (cat: Exclude<CategoryFilter, 'all'>) =>
    updates.filter(u => u.category?.toLowerCase() === cat).length;

  const unreadCountFor = (cat: CategoryFilter) => {
    if (cat === 'all') return unreadIds.size;
    return updates.filter(u => u.category?.toLowerCase() === cat && unreadIds.has(u.id)).length;
  };

  // ── Filtered list ───────────────────────────────────────────────
  const filtered = updates.filter(u => {
    if (categoryFilter !== 'all' && u.category?.toLowerCase() !== categoryFilter) return false;
    if (showUnreadOnly && !unreadIds.has(u.id)) return false;
    return true;
  });

  // ── Helpers ─────────────────────────────────────────────────────
  const getCategoryBadge = (category: string | null) => {
    switch (category?.toLowerCase()) {
      case 'feature':
        return (
          <Badge className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 shadow-none dark:bg-emerald-500/20 dark:text-emerald-400 gap-1">
            <Zap className="w-3 h-3" /> Nova Funcionalidade
          </Badge>
        );
      case 'bugfix':
        return (
          <Badge className="bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 shadow-none dark:bg-red-500/20 dark:text-red-400 gap-1">
            <Bug className="w-3 h-3" /> Correção
          </Badge>
        );
      default:
        return (
          <Badge className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 border border-sky-500/20 shadow-none dark:bg-sky-500/20 dark:text-sky-400 gap-1">
            <Info className="w-3 h-3" /> Aviso
          </Badge>
        );
    }
  };

  const renderAttachments = (attachments: any) => {
    if (!attachments || !Array.isArray(attachments) || attachments.length === 0) return null;
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {attachments.map((file: any, index: number) => (
          <a
            key={index}
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-md text-xs font-medium hover:bg-muted/80 transition-colors border border-border/50"
          >
            <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="truncate max-w-[200px]">{file.name || 'Anexo'}</span>
          </a>
        ))}
      </div>
    );
  };

  // ── Loading skeleton ────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-border/50">
            <CardHeader className="pb-3">
              <div className="w-24 h-5 bg-muted rounded-md" />
              <div className="w-1/2 h-6 bg-muted rounded-md mt-2" />
            </CardHeader>
            <CardContent>
              <div className="w-full h-16 bg-muted rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────
  if (updates.length === 0) {
    return (
      <Card className="border-dashed border-2 bg-transparent">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <Info className="w-12 h-12 mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium text-foreground">Nenhuma atualização</h3>
          <p className="text-sm">As novidades do sistema aparecerão aqui em breve.</p>
        </CardContent>
      </Card>
    );
  }

  // ── Main render ─────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Atualizações do Sistema
            {unreadIds.size > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                {unreadIds.size}
              </span>
            )}
          </h2>
          <p className="text-muted-foreground text-sm">
            Acompanhe as últimas novidades, melhorias e correções.
          </p>
        </div>

        {unreadIds.size > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="gap-2 self-start sm:self-auto"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />

        {(
          [
            { key: 'all' as CategoryFilter,    label: 'Todos',      count: updates.length },
            { key: 'feature' as CategoryFilter, label: 'Novidades',  count: countBy('feature') },
            { key: 'bugfix' as CategoryFilter,  label: 'Correções',  count: countBy('bugfix') },
            { key: 'aviso' as CategoryFilter,   label: 'Avisos',     count: countBy('aviso') },
          ]
        ).map(({ key, label, count }) => {
          const isActive = categoryFilter === key;
          const uCount = unreadCountFor(key);
          return (
            <button
              key={key}
              onClick={() => setCategoryFilter(key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all',
                isActive
                  ? 'border-primary bg-primary/10 text-primary shadow-sm font-semibold'
                  : 'border-border bg-background text-muted-foreground hover:border-border/80 hover:bg-muted/50 hover:text-foreground'
              )}
            >
              {label}
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
                isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              )}>
                {count}
              </span>
              {uCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {uCount > 9 ? '9+' : uCount}
                </span>
              )}
            </button>
          );
        })}

        {/* Toggle não lidas */}
        <button
          onClick={() => setShowUnreadOnly(v => !v)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all',
            showUnreadOnly
              ? 'border-red-500 bg-red-500/10 text-red-600 shadow-sm font-semibold'
              : 'border-border bg-background text-muted-foreground hover:border-red-400 hover:text-red-500'
          )}
        >
          Não lidas
          {unreadIds.size > 0 && (
            <span className={cn(
              'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
              showUnreadOnly ? 'bg-red-500/20 text-red-700' : 'bg-red-100 text-red-600'
            )}>
              {unreadIds.size}
            </span>
          )}
        </button>
      </div>

      {/* Lista vazia após filtro */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
          <CheckCheck className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-sm font-medium">
            {showUnreadOnly ? 'Nenhuma não lida nesta categoria.' : 'Nenhum resultado para este filtro.'}
          </p>
        </div>
      )}

      {/* Timeline */}
      {filtered.length > 0 && (
        <div className="relative border-l border-border ml-3 md:ml-4 space-y-8 pb-4">
          {filtered.map((update) => {
            const isUnread = unreadIds.has(update.id);
            return (
              <div key={update.id} className="relative pl-6 md:pl-8">
                {/* Timeline dot — pulsante se não lida */}
                <span
                  className={cn(
                    'absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-background',
                    isUnread ? 'bg-red-500 animate-pulse' : 'bg-primary'
                  )}
                />

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                    <time dateTime={update.created_at} className="font-medium">
                      {format(new Date(update.created_at), "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}
                    </time>
                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline">•</span>
                      <span>Por {update.author_name || 'Equipe Yooga'}</span>
                    </div>
                    {isUnread && (
                      <button
                        onClick={() => markOneAsRead(update.id)}
                        className="flex items-center gap-1 text-[11px] text-red-500 hover:text-red-400 transition-colors font-medium"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block" />
                        Novo · marcar como lida
                      </button>
                    )}
                  </div>

                  <Card
                    className={cn(
                      'border-border/50 hover:border-border/80 transition-colors shadow-sm',
                      isUnread && 'ring-1 ring-red-500/30 border-red-500/30'
                    )}
                  >
                    <CardHeader className="pb-3 gap-1">
                      <div className="flex items-start justify-between gap-2">
                        {getCategoryBadge(update.category)}
                        {isUnread && (
                          <span className="flex-shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            NOVO
                          </span>
                        )}
                      </div>
                      {update.title && (
                        <CardTitle className="text-lg mt-2 leading-snug">
                          {update.title}
                        </CardTitle>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {update.ai_summary || 'Resumo indisponível.'}
                      </div>
                      {renderAttachments(update.attachments)}
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
