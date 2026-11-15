import { Role } from "@prisma/client";
import {
  BuildingIcon,
  HardHatIcon,
  UserCheckIcon,
  ClipboardListIcon,
  SettingsIcon,
  PlusCircleIcon,
  ClockIcon,
  BriefcaseIcon,
} from "@/components/icons";

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
  badgeVariant?: "warning" | "danger" | "info";
  alertCounts?: { critical: number; warning: number };
  mobileHighlight?: boolean;
}

export interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

export interface NavigationBadges {
  foremanPendingLogsCount?: number;
  workerRejectedLogsCount?: number;
  tasksOverdueOrDueTodayCount?: number;
  criticalAlertsCount?: number;
  warningAlertsCount?: number;
}

export function getSidebarNavigation(
  role: Role,
  badges: NavigationBadges = {}
): NavigationGroup[] {
  const tasksBadge = badges.tasksOverdueOrDueTodayCount && badges.tasksOverdueOrDueTodayCount > 0
    ? badges.tasksOverdueOrDueTodayCount
    : undefined;

  if (role === Role.OWNER) {
    return [
      {
        label: "Principal",
        items: [
          { name: "Visão Geral", href: "/dashboard", icon: ClipboardListIcon },
          { name: "Obras", href: "/dashboard/obras", icon: BuildingIcon },
          { name: "Equipa", href: "/dashboard/equipa", icon: UserCheckIcon },
          { name: "Clientes", href: "/dashboard/clientes", icon: BriefcaseIcon },
          { name: "Registos", href: "/dashboard/registos", icon: ClockIcon },
          {
            name: "Tarefas",
            href: "/dashboard/tarefas",
            icon: ClipboardListIcon,
            badgeCount: tasksBadge,
            badgeVariant: "warning",
          },
        ],
      },
      {
        label: "Operação",
        items: [
          { name: "Visitas", href: "/dashboard/visitas", icon: ClockIcon },
          { name: "Orçamentos", href: "/dashboard/orcamentos", icon: BriefcaseIcon },
          {
            name: "Alertas",
            href: "/dashboard/alertas",
            icon: ClockIcon,
            alertCounts: {
              critical: badges.criticalAlertsCount ?? 0,
              warning: badges.warningAlertsCount ?? 0,
            },
          },
        ],
      },
      {
        label: "Administração",
        items: [
          { name: "Definições da Empresa", href: "/dashboard/definicoes", icon: SettingsIcon },
          { name: "O Meu Perfil", href: "/dashboard/perfil", icon: UserCheckIcon },
        ],
      },
    ];
  }

  if (role === Role.FOREMAN) {
    const pendingLogsBadge = badges.foremanPendingLogsCount && badges.foremanPendingLogsCount > 0
      ? badges.foremanPendingLogsCount
      : undefined;

    return [
      {
        label: "No Terreno",
        items: [
          { name: "Visão Geral", href: "/dashboard", icon: ClipboardListIcon },
          { name: "As Minhas Obras", href: "/dashboard/as-minhas-obras", icon: HardHatIcon },
          { name: "Novo Registo", href: "/dashboard/novo-registo", icon: PlusCircleIcon },
          {
            name: "Registos da Obra",
            href: "/dashboard/validar-registos",
            icon: ClockIcon,
            badgeCount: pendingLogsBadge,
            badgeVariant: "warning",
          },
          {
            name: "As Minhas Tarefas",
            href: "/dashboard/tarefas",
            icon: ClipboardListIcon,
            badgeCount: tasksBadge,
            badgeVariant: "warning",
          },
          { name: "Equipa da Obra", href: "/dashboard/equipa-obra", icon: UserCheckIcon },
          { name: "O Meu Perfil", href: "/dashboard/perfil", icon: UserCheckIcon },
        ],
      },
    ];
  }

  // WORKER
  const rejectedLogsBadge = badges.workerRejectedLogsCount && badges.workerRejectedLogsCount > 0
    ? badges.workerRejectedLogsCount
    : undefined;

  return [
    {
      label: "O Meu Dia",
      items: [
        { name: "Início", href: "/dashboard", icon: BuildingIcon },
        { name: "Novo Registo", href: "/dashboard/novo-registo", icon: PlusCircleIcon },
        {
          name: "Os Meus Registos",
          href: "/dashboard/os-meus-registos",
          icon: ClockIcon,
          badgeCount: rejectedLogsBadge,
          badgeVariant: "danger",
        },
        {
          name: "As Minhas Tarefas",
          href: "/dashboard/tarefas",
          icon: ClipboardListIcon,
          badgeCount: tasksBadge,
          badgeVariant: "warning",
        },
        { name: "O Meu Perfil", href: "/dashboard/perfil", icon: UserCheckIcon },
      ],
    },
  ];
}

export function getMobileNavigation(
  role: Role,
  badges: NavigationBadges = {}
): NavigationItem[] {
  const tasksBadge = badges.tasksOverdueOrDueTodayCount && badges.tasksOverdueOrDueTodayCount > 0
    ? badges.tasksOverdueOrDueTodayCount
    : undefined;

  if (role === Role.OWNER) {
    return [
      { name: "Início", href: "/dashboard", icon: ClipboardListIcon },
      { name: "Obras", href: "/dashboard/obras", icon: BuildingIcon },
      { name: "Visitas", href: "/dashboard/visitas", icon: ClockIcon },
      { name: "Orçamentos", href: "/dashboard/orcamentos", icon: BriefcaseIcon },
      {
        name: "Tarefas",
        href: "/dashboard/tarefas",
        icon: ClipboardListIcon,
        badgeCount: tasksBadge,
        badgeVariant: "warning",
      },
      { name: "Perfil", href: "/dashboard/perfil", icon: SettingsIcon },
    ];
  }

  if (role === Role.FOREMAN) {
    const pendingLogsBadge = badges.foremanPendingLogsCount && badges.foremanPendingLogsCount > 0
      ? badges.foremanPendingLogsCount
      : undefined;

    return [
      { name: "Início", href: "/dashboard", icon: ClipboardListIcon },
      { name: "Obras", href: "/dashboard/as-minhas-obras", icon: HardHatIcon },
      { name: "Registar", href: "/dashboard/novo-registo", icon: PlusCircleIcon, mobileHighlight: true },
      {
        name: "Tarefas",
        href: "/dashboard/tarefas",
        icon: ClipboardListIcon,
        badgeCount: tasksBadge,
        badgeVariant: "warning",
      },
      {
        name: "Validar",
        href: "/dashboard/validar-registos",
        icon: ClockIcon,
        badgeCount: pendingLogsBadge,
        badgeVariant: "warning",
      },
    ];
  }

  // WORKER
  const rejectedLogsBadge = badges.workerRejectedLogsCount && badges.workerRejectedLogsCount > 0
    ? badges.workerRejectedLogsCount
    : undefined;

  return [
    { name: "Início", href: "/dashboard", icon: BuildingIcon },
    { name: "Registar", href: "/dashboard/novo-registo", icon: PlusCircleIcon, mobileHighlight: true },
    {
      name: "Tarefas",
      href: "/dashboard/tarefas",
      icon: ClipboardListIcon,
      badgeCount: tasksBadge,
      badgeVariant: "warning",
    },
    {
      name: "Registos",
      href: "/dashboard/os-meus-registos",
      icon: ClockIcon,
      badgeCount: rejectedLogsBadge,
      badgeVariant: "danger",
    },
    { name: "Perfil", href: "/dashboard/perfil", icon: UserCheckIcon },
  ];
}

