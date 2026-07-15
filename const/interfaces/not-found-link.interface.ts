import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export interface NotFoundLink {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  href: string;
}

export interface NotFoundProps {
  errorCode?: string;
  title?: string;
  description?: string;
  links: NotFoundLink[];
  onBackClick?: () => void;
  onHomeClick?: () => void;
  backButtonText?: string;
  homeButtonText?: string;
  showBackground?: boolean;
  className?: string;
  children?: ReactNode;
}
