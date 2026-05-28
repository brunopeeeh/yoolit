import { ExternalLink, Calendar, Lightbulb, Vote } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// CONFIGURAÇÃO DOS LINKS DO HUB INTERNO
// Altere as URLs abaixo para as planilhas e formulários reais da sua equipe.
const HUB_LINKS = {
  vacation: {
    title: 'Agendamento de Férias',
    description: 'Acesse a planilha oficial para planejar e agendar seu período de descanso e férias com a equipe.',
    url: 'https://docs.google.com/spreadsheets/d/1WpkEaosA1GQfRDmqp_UqA2lroUtwoUuQbXE875DDDog/edit',
    icon: Calendar,
    color: 'from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border-orange-500/30',
    iconColor: 'text-orange-500',
    badge: 'Planilha',
    buttonText: 'Acessar Planilha',
  },
  weekly: {
    title: 'Sugestões para a Weekly',
    description: 'Envie suas ideias de pauta, feedbacks ou temas interessantes para debatermos em nossa reunião semanal.',
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSfstsj-bJuW8fTq7sZgQ3r5pvdeVWuxGF7pFqLLPqCW0Tahkw/viewform',
    icon: Lightbulb,
    color: 'from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border-teal-500/30',
    iconColor: 'text-teal-500',
    badge: 'Formulário',
    buttonText: 'Dar Sugestão',
  },
  holiday: {
    title: 'Votação de Folga (Feriados)',
    description: 'Participe da enquete de escala para feriados e vote sobre as preferências de folga da equipe.',
    url: 'https://forms.gle/placeholder-feriado',
    icon: Vote,
    color: 'from-blue-500/20 to-sky-500/20 hover:from-blue-500/30 hover:to-sky-500/30 border-sky-500/30',
    iconColor: 'text-sky-500',
    badge: 'Enquete',
    buttonText: 'Votar Agora',
  },
};

export function HubInterno() {
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/75 bg-clip-text">
          Hub Interno 👋
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Central de atalhos e ferramentas importantes para o time. Aqui você encontra os principais formulários, planilhas e enquetes oficiais para a gestão do seu dia a dia.
        </p>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {Object.entries(HUB_LINKS).map(([key, item]) => {
          const IconComponent = item.icon;
          return (
            <Card
              key={key}
              className={`relative overflow-hidden flex flex-col justify-between border bg-gradient-to-br ${item.color} transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/5 group`}
            >
              {/* Orb Decorativo sutil de fundo */}
              <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-white/5 blur-2xl group-hover:bg-white/10 transition-colors" />

              <CardHeader className="space-y-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-2xl bg-background/80 border border-border/40 ${item.iconColor} shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-background/60 border border-border/20 text-muted-foreground">
                    {item.badge}
                  </span>
                </div>

                <div className="space-y-2">
                  <CardTitle className="text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="pt-0 pb-6 px-6">
                <Button
                  asChild
                  variant="outline"
                  className="w-full relative overflow-hidden rounded-xl font-semibold text-xs tracking-wide transition-all duration-200 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 hover:border-slate-300 dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-white dark:border-slate-800 shadow-sm hover:shadow"
                >
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    <span>{item.buttonText}</span>
                    <ExternalLink className="h-3 w-3 opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Informativo / Dica no Rodapé */}
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-5 text-center max-w-3xl mx-auto mt-6">
        <span className="text-xl">💡</span>
        <p className="text-xs font-semibold text-muted-foreground mt-1.5">
          Precisa adicionar algum link ou formulário novo aqui?
        </p>
        <p className="text-[11px] text-muted-foreground/60 mt-0.5">
          Entre em contato com o supervisor da equipe para atualizar o diretório de links oficiais do Hub Interno.
        </p>
      </div>
    </div>
  );
}
