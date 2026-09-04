import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <Link href="/disputes" className="text-lg font-bold text-blue-600">
              ClearCase
            </Link>
            <span className="text-xs text-gray-500">For Razorpay merchants</span>
          </div>
          <Link href="/metrics" className="text-sm text-muted-foreground hover:underline">
            Metrics &rarr;
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
