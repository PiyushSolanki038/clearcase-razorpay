import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-14 flex items-center justify-between">
          <Link href="/disputes" className="flex items-center gap-2 group">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="size-4" strokeWidth={2.25} />
            </span>
            <span className="flex items-baseline gap-2">
              <span className="text-[15px] font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
                ClearCase
              </span>
              <span className="hidden sm:inline text-xs text-muted-foreground">
                For Razorpay merchants
              </span>
            </span>
          </Link>
          <Link
            href="/metrics"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Metrics &rarr;
          </Link>
        </div>
      </header>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
