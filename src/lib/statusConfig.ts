import {
  MessageSquare,
  Users,
  Coffee,
  Clock,
  Droplets,
  ExternalLink,
  CheckCircle,
  XCircle,
} from "lucide-react";

export interface StatusConfig {
  value: string;
  label: string;
  icon: any;
  hexColor: string;      // Para usar em styles inline
  textColor: string;     // Para usar em className (Tailwind)
  bgColor: string;       // Para usar no gráfico (Tailwind)
}

export const STATUS_CONFIG: StatusConfig[] = [
  { 
    value: "feedback", 
    label: "Feedback", 
    icon: MessageSquare, 
    hexColor: "#3B82F6",
    textColor: "text-blue-500",
    bgColor: "bg-blue-500"
  },
  { 
    value: "meeting", 
    label: "Reunião/Treinamento", 
    icon: Users, 
    hexColor: "#8B5CF6",
    textColor: "text-purple-500",
    bgColor: "bg-purple-500"
  },
  { 
    value: "yooga", 
    label: "Yooga Timer⭐", 
    icon: Coffee, 
    hexColor: "#F59E0B",
    textColor: "text-amber-500",
    bgColor: "bg-amber-500"
  },
  { 
    value: "pause", 
    label: "Pausa - Aprovada", 
    icon: Clock, 
    hexColor: "#EAB308",
    textColor: "text-yellow-500",
    bgColor: "bg-yellow-500"
  },
  { 
    value: "water", 
    label: "Água/Banheiro", 
    icon: Droplets, 
    hexColor: "#06B6D4",
    textColor: "text-cyan-500",
    bgColor: "bg-cyan-500"
  },
  { 
    value: "external", 
    label: "Demandas Externas", 
    icon: ExternalLink, 
    hexColor: "#4338CA",
    textColor: "text-indigo-700",
    bgColor: "bg-indigo-700"
  },
  { 
    value: "available", 
    label: "Disponível", 
    icon: CheckCircle, 
    hexColor: "#10B981",
    textColor: "text-emerald-500",
    bgColor: "bg-emerald-500"
  },
  { 
    value: "unavailable", 
    label: "Indisponível", 
    icon: XCircle, 
    hexColor: "#ef4444",
    textColor: "text-red-500",
    bgColor: "bg-red-500"
  },
];

// Helper functions
export const getStatusConfig = (statusValue: string): StatusConfig => {
  return STATUS_CONFIG.find(s => s.value === statusValue) || STATUS_CONFIG[6]; // default: available
};

export const getStatusBgColor = (statusValue: string): string => {
  return getStatusConfig(statusValue).bgColor;
};

export const getStatusLabel = (statusValue: string): string => {
  return getStatusConfig(statusValue).label;
};
