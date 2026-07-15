// Outline icons on a 24 grid with a 1.8 stroke and rounded joins — the weight
// and roundness the reference export uses throughout its nav, tiles, and cards.

type IconProps = { className?: string };

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-5 w-5"}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function HomeIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3.5 10.2 12 3.5l8.5 6.7" />
      <path d="M5.5 9.5V19a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5V9.5" />
      <path d="M9.75 20.5V14h4.5v6.5" />
    </Svg>
  );
}

export function CalendarIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
    </Svg>
  );
}

// "Affirmation" — a sparkle cluster.
export function SparkleIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3.5l1.7 4.3 4.3 1.7-4.3 1.7L12 15.5l-1.7-4.3L6 9.5l4.3-1.7z" />
      <path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
    </Svg>
  );
}

// "History" — a clock with a rewind arrow.
export function HistoryIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
      <path d="M3.5 4.5V9H8" />
      <path d="M12 7.5V12l3 1.8" />
    </Svg>
  );
}

export function ClockIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.2 1.9" />
    </Svg>
  );
}

export function JournalIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6.5 3.5h11a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5h-11z" />
      <path d="M6.5 3.5A2.5 2.5 0 0 0 4 6v12a2.5 2.5 0 0 0 2.5 2.5" />
      <path d="M9.5 8.5h6M9.5 12h4" />
    </Svg>
  );
}

export function UserIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="8" r="3.75" />
      <path d="M5 20.5c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5" />
    </Svg>
  );
}

export function UsersIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="9.5" cy="8.5" r="3.25" />
      <path d="M3.5 19.5c0-3.2 2.7-4.8 6-4.8s6 1.6 6 4.8" />
      <path d="M16.5 5.6a3.25 3.25 0 0 1 0 5.8M17.5 14.9c2.1.5 3.5 1.9 3.5 4.6" />
    </Svg>
  );
}

export function ClipboardIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9 4.5H7a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V6A1.5 1.5 0 0 0 17 4.5h-2" />
      <rect x="9" y="2.75" width="6" height="3.5" rx="1.25" />
      <path d="M8.75 11h6.5M8.75 14.5h4.5" />
    </Svg>
  );
}

export function ChartIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M7 16.5v-4M12 16.5v-9M17 16.5v-6" />
      <path d="M3.5 20.5h17" />
    </Svg>
  );
}

export function LogoutIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M14.5 4.5H7A2 2 0 0 0 5 6.5v11a2 2 0 0 0 2 2h7.5" />
      <path d="M10.5 12h9.5M17 8.5l3.5 3.5-3.5 3.5" />
    </Svg>
  );
}

export function ChevronRightIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9.5 5.5 16 12l-6.5 6.5" />
    </Svg>
  );
}

export function ChevronLeftIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </Svg>
  );
}

export function ArrowRightIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4.5 12h15M13.5 6l6 6-6 6" />
    </Svg>
  );
}

export function PlusIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function PencilIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M16.5 3.9a2 2 0 0 1 2.8 2.8L7.6 18.4l-3.8 1 1-3.8z" />
      <path d="M14.8 5.6l3.6 3.6" />
    </Svg>
  );
}

export function SearchIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="M15.8 15.8l4.4 4.4" />
    </Svg>
  );
}

export function FilterIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 6.5h16M7 12h10M10 17.5h4" />
    </Svg>
  );
}

export function SmileIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 13.5a4 4 0 0 0 7 0" />
      <path d="M9 9.5h.01M15 9.5h.01" />
    </Svg>
  );
}

export function CheckCircleIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.2l2.4 2.3 4.6-4.8" />
    </Svg>
  );
}

export function AlertIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5M12 16h.01" />
    </Svg>
  );
}

export const NAV_ICONS = {
  home: HomeIcon,
  calendar: CalendarIcon,
  affirmation: SparkleIcon,
  history: HistoryIcon,
  journal: JournalIcon,
  user: UserIcon,
  users: UsersIcon,
  chart: ChartIcon,
  clipboard: ClipboardIcon,
  clock: ClockIcon,
} as const;

export type IconKey = keyof typeof NAV_ICONS;
