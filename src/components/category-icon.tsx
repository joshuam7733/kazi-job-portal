import {
  Briefcase,
  Calculator,
  ChartNoAxesCombined,
  ClipboardList,
  Code2,
  ConciergeBell,
  GraduationCap,
  HandHeart,
  Headset,
  HeartPulse,
  Megaphone,
  Palette,
  Scale,
  Sprout,
  Truck,
  Users,
  Wrench,
} from "lucide-react";

const ICONS = {
  Calculator,
  ChartNoAxesCombined,
  ClipboardList,
  Code2,
  ConciergeBell,
  GraduationCap,
  HandHeart,
  Headset,
  HeartPulse,
  Megaphone,
  Palette,
  Scale,
  Sprout,
  Truck,
  Users,
  Wrench,
};

export const CATEGORY_ICON_NAMES = Object.keys(ICONS);

export function CategoryIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = (name && ICONS[name as keyof typeof ICONS]) || Briefcase;
  return <Icon className={className} aria-hidden />;
}
