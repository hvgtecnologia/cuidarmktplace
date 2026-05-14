import {
  Loader2,
  HeartHandshake,
  Heart,
  Globe,
  ShieldCheck,
  Stethoscope,
  Users,
  Search,
  Star,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquareHeart,
  Sparkles,
  ArrowRight,
  Menu,
  X,
  Sun,
  Moon,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  BellRing,
  BadgeCheck,
  GraduationCap,
  HandHeart,
  type LucideProps,
} from "lucide-react"

// Ícones de redes sociais removidos do lucide-react v1.x — SVG inline
const Instagram = (props: LucideProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
)

const Facebook = (props: LucideProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
)

const Linkedin = (props: LucideProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

export const Icons = {
  spinner: Loader2,
  logo: HeartHandshake,
  heart: Heart,
  google: Globe,
  shield: ShieldCheck,
  stethoscope: Stethoscope,
  users: Users,
  search: Search,
  star: Star,
  check: CheckCircle2,
  clock: Clock,
  pin: MapPin,
  chat: MessageSquareHeart,
  sparkles: Sparkles,
  arrowRight: ArrowRight,
  menu: Menu,
  close: X,
  sun: Sun,
  moon: Moon,
  phone: Phone,
  mail: Mail,
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  calendar: Calendar,
  card: CreditCard,
  bell: BellRing,
  verified: BadgeCheck,
  graduation: GraduationCap,
  handHeart: HandHeart,
}

export type IconKey = keyof typeof Icons
export type Icon = (props: LucideProps) => JSX.Element
