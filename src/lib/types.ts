export type JobStatus =
  | "DISCOVERED"
  | "SAVED"
  | "APPLIED"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED"
  | "WITHDRAWN";

export const STATUS_LABELS: Record<JobStatus, string> = {
  DISCOVERED: "Discovered",
  SAVED: "Saved",
  APPLIED: "Applied",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export const STATUS_COLORS: Record<JobStatus, string> = {
  DISCOVERED: "bg-neutral-100 text-neutral-600",
  SAVED: "bg-blue-100 text-blue-700",
  APPLIED: "bg-indigo-100 text-indigo-700",
  INTERVIEW: "bg-purple-100 text-purple-700",
  OFFER: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  WITHDRAWN: "bg-neutral-200 text-neutral-500",
};

export interface Job {
  id: string;
  url: string;
  title: string;
  company: string;
  location: string | null;
  source: string | null;
  description: string | null;
  salary: string | null;
  openDate: string | null;
  closingDate: string | null;
  status: JobStatus;
  notes: string | null;
  atsScore: number | null;
  atsDetail: string | null;
  nextSteps: string | null;
  companyBrief: string | null;
  lastScannedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
