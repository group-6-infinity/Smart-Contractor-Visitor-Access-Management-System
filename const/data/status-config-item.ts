import { HardHat, User } from "lucide-react";

export const statusConfig = {
  PENDING: {
    label: "Pending Review",
    className:
      "border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-950/30",
  },
  APPROVED: {
    label: "Approved",
    className:
      "border-green-400 text-green-600 bg-green-50 dark:bg-green-950/30",
  },
  REJECTED: {
    label: "Rejected",
    className: "border-red-400 text-red-600 bg-red-50 dark:bg-red-950/30",
  },
};


export const typeConfig = {
  VISITOR: {
    label: "Visitor",
    className:
      "border-border-border text-muted-foreground bg-info-muted-fogreound",
    icon: User,
  },
  CONTRACTOR: {
    label: "Contractor",
    className: "border-border-border text-muted-foreground",
    icon: HardHat,
  },
}




