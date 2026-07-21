import {
  User,
  HardHat,
  ClipboardList,
  FileCheck,
  CheckCircle2,
  Mail,
  MapPin,
  CalendarClock,
  LucideIcon,
} from "lucide-react";

export interface GuideStepField {
  label: string;
  variant?: "default" | "doc" | "extra";
}

export interface GuideStep {
  step: number;
  icon: LucideIcon;
  title: string;
  description: string;
  fields?: GuideStepField[];
  image?: {
    src: string;
    alt: string;
  };
}

export const VISITOR_STEPS: GuideStep[] = [
  {
    step: 1,
    icon: User,
    title: 'Select "Visitor Registration"',
    description:
      "On the Register Gate Access page, choose Visitor to start the pre-registration form.",
    image: {
      src: "/user-guidance/visitor-step1.png",
      alt: "Register Gate Access landing page",
    },
  },
  {
    step: 2,
    icon: ClipboardList,
    title: "Fill in basic info",
    description: "Enter your personal and company details.",
    fields: [
      { label: "Full Name" },
      { label: "Email" },
      { label: "Company" },
      { label: "Phone" },
    ],
    image: {
      src: "/user-guidance/visitor-step2.png",
      alt: "Basic info form",
    },
  },
  {
    step: 3,
    icon: FileCheck,
    title: "Upload required documents",
    description:
      "Provide your ID and a face photo, then confirm the biometric consent checkbox.",
    fields: [
      { label: "KTP", variant: "doc" },
      { label: "Face Photo", variant: "doc" },
    ],
    image: {
      src: "/user-guidance/visitor-step3.png",
      alt: "Document upload step",
    },
  },
  {
    step: 4,
    icon: CheckCircle2,
    title: "Registration submitted",
    description:
      "You'll see a confirmation screen — the HSE team will review your documents next.",
    image: {
      src: "/user-guidance/visitor-step4.png",
      alt: "Registration submitted confirmation",
    },
  },
  {
    step: 5,
    icon: Mail,
    title: "Check your email",
    description:
      'A tracking ID and a "Track My Registration" link are sent to your email — save this to check your approval status later.',
    image: {
      src: "/user-guidance/visitor-step5.png",
      alt: "Email with tracking ID",
    },
  },
  {
    step: 6,
    icon: MapPin,
    title: "Track your status anytime",
    description:
      "Go to the tracking page and enter your registered email to find your registration status.",
    image: {
      src: "/user-guidance/visitor-step6.png",
      alt: "Track registration status page",
    },
  },
  {
    step: 7,
    icon: CalendarClock,
    title: "Set Visit Time Preference",
    description:
      "After your registration is approved by the HSE/HR Admin, you may set your preferred visit schedule by filling in the Reason for Visit, Start Window, and End Window.",
  },
];

export const CONTRACTOR_STEPS: GuideStep[] = [
  {
    step: 1,
    icon: HardHat,
    title: 'Select "Contractor Registration"',
    description:
      "On the Register Gate Access page, choose Contractor to start the pre-registration form.",
    image: {
      src: "/user-guidance/contractor-step1.png",
      alt: "Register Gate Access landing page",
    },
  },
  {
    step: 2,
    icon: ClipboardList,
    title: "Fill in basic info",
    description: "Enter your personal and company details.",
    fields: [
      { label: "Full Name" },
      { label: "Email" },
      { label: "Company" },
      { label: "Phone" },
    ],
    image: {
      src: "/user-guidance/contractor-step2.png",
      alt: "Basic info form",
    },
  },
  {
    step: 3,
    icon: FileCheck,
    title: "Upload required documents",
    description:
      "Contractors need additional work-safety documents on top of ID and photo, then confirm the biometric consent checkbox.",
    fields: [
      { label: "KTP", variant: "doc" },
      { label: "Face Photo", variant: "doc" },
      { label: "BPJS", variant: "extra" },
      { label: "SIO Certificate", variant: "extra" },
      { label: "SIA Certificate", variant: "extra" },
    ],
    image: {
      src: "/user-guidance/contractor-step3.png",
      alt: "Document upload step",
    },
  },
  {
    step: 4,
    icon: CheckCircle2,
    title: "Registration submitted",
    description:
      "You'll see a confirmation screen — the HSE team will review your documents next.",
    image: {
      src: "/user-guidance/contractor-step4.png",
      alt: "Registration submitted confirmation",
    },
  },
  {
    step: 5,
    icon: Mail,
    title: "Check your email",
    description:
      'A tracking ID and a "Track My Registration" link are sent to your email — save this to check your approval status later.',
    image: {
      src: "/user-guidance/contractor-step5.png",
      alt: "Email with tracking ID",
    },
  },
  {
    step: 6,
    icon: MapPin,
    title: "Track your status anytime",
    description:
      "Go to the tracking page and enter your registered email to find your registration status.",
    image: {
      src: "/user-guidance/contractor-step6.png",
      alt: "Track registration status page",
    },
  },
  {
    step: 7,
    icon: CalendarClock,
    title: "Set Visit Time Preference",
    description:
      "After your registration is approved by the HSE/HR Admin, you may set your preferred visit schedule by filling in the Reason for Visit, Start Window, and End Window.",
  },
];
