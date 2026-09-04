export function formatMoney(paise: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(paise / 100);
}

export interface DeadlineInfo {
  label: string;
  urgency: "expired" | "urgent" | "soon" | "ok";
}

export function formatDeadline(deadlineAt: Date | string, now: Date = new Date()): DeadlineInfo {
  const deadline = new Date(deadlineAt);
  const msLeft = deadline.getTime() - now.getTime();
  const daysLeft = Math.ceil(msLeft / 86_400_000);

  if (msLeft < 0) {
    return { label: `Expired ${Math.abs(daysLeft)}d ago`, urgency: "expired" };
  }
  if (daysLeft <= 3) {
    return { label: `${daysLeft}d left`, urgency: "urgent" };
  }
  if (daysLeft <= 10) {
    return { label: `${daysLeft}d left`, urgency: "soon" };
  }
  return { label: `${daysLeft}d left`, urgency: "ok" };
}
