import {
  Inbox,
  FileCheck,
  MapPinCheck,
  Users,
  ScanLine,
  ShieldAlert,
  LucideIcon,
} from "lucide-react";

export interface GuideField {
  label: string;
  variant?: "default" | "info" | "success" | "destructive";
}

export interface StaffGuideStep {
  step: number;
  icon: LucideIcon;
  title: string;
  description: string;
  details?: string[];
  fields?: GuideField[];
}

export const HSE_GUIDE_STEPS: StaffGuideStep[] = [
  {
    step: 1,
    icon: Inbox,
    title: "New registration lands on your dashboard",
    description:
      "Once a visitor or contractor submits their registration, a Telegram notification is sent to HSE and HR, and it shows up under Pending Review in Registrations. Click a user to open their submission.",
    fields: [{ label: "Pending Review", variant: "destructive" }],
  },
  {
    step: 2,
    icon: FileCheck,
    title: "Review documents in Registrations",
    description:
      "Clicking the user opens the Registrations detail page. From here you can:",
    details: [
      "Check the submitted documents and confirm the person is eligible",
      "Set the expiry date for each relevant document",
      "Track documents nearing expiry in the Document Expiry section",
      "Blacklist a user if they shouldn't be allowed to visit",
      "Approve or Reject the registration",
    ],
    fields: [
      { label: "Set Expiry Date", variant: "info" },
      { label: "Document Expiry" },
      { label: "Blacklist", variant: "destructive" },
    ],
  },
  {
    step: 3,
    icon: MapPinCheck,
    title: "Approve the visit request & grant zone access",
    description:
      "After being approved, the user submits a visit request. You'll get a notification to verify and approve it — including which zones they're allowed into. Once accepted, the user's device shows a unique token and QR code to check in as visitor/contractor for their chosen date and time.",
    fields: [
      { label: "Zone Access Granted", variant: "success" },
      { label: "Token + QR Issued", variant: "info" },
    ],
  },
  {
    step: 4,
    icon: Users,
    title: "Monitor who's on site & generate an evacuation report",
    description:
      "Check the number of people currently in the building, along with their details, at any time on the Who's Inside page. You can also generate an Emergency Evacuation List (PDF) to see the full breakdown.",
    fields: [{ label: "Live Occupancy" }, { label: "Evacuation Report" }],
  },
];

export const SECURITY_GUIDE_STEPS: StaffGuideStep[] = [
  {
    step: 1,
    icon: ScanLine,
    title: "Check-in with token & QR code",
    description:
      "The visitor or contractor approaches you and shows their unique token and QR code. Scan it on the Check-In page to validate them.",
    details: [
      "If their visit is within the approved time window — grant access.",
      "If it's outside the time window — deny access.",
    ],
    fields: [
      { label: "Within Window → Grant", variant: "success" },
      { label: "Outside Window → Deny", variant: "destructive" },
    ],
  },
  {
    step: 2,
    icon: Users,
    title: "Monitor who's currently inside",
    description:
      "The Who's Inside page keeps you updated on the status of everyone inside the building. A person can appear under more than one status at the same time.",
  },
  {
    step: 3,
    icon: ShieldAlert,
    title: "Alerts & Watchlist",
    description:
      "The Alerts page tracks overstaying visitors, high-risk individuals currently inside, and the last 20 denied entries. The Watchlist page lists blacklisted individuals, who are automatically denied at check-in — if a blacklisted user attempts to check in, their status pops up right during the Check-In step, so you can act on it immediately.",
    fields: [
      { label: "Overstay", variant: "destructive" },
      { label: "High Risk Inside", variant: "destructive" },
      { label: "Denied Entries", variant: "destructive" },
      { label: "Blacklist Auto-Deny", variant: "destructive" },
    ],
  },
];

export interface SecurityStatus {
  label: string;
  description: string;
  color: "success" | "warning" | "destructive";
}

export const SECURITY_STATUSES: SecurityStatus[] = [
  {
    label: "Normal",
    description: "Checked in, within their approved time window.",
    color: "success",
  },
  {
    label: "Overstaying",
    description: "Still inside past their approved time window.",
    color: "warning",
  },
  {
    label: "High Risk",
    description: "Flagged for entering a hazardous or restricted zone.",
    color: "destructive",
  },
];
