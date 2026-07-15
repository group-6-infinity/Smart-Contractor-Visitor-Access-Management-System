export interface RegistrationItem {
  trackingToken: string;
  type: "VISITOR" | "CONTRACTOR";
  fullName: string;
  company: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}
