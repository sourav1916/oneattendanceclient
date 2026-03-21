const Sk = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
);

const StatCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-5 flex flex-col gap-4">
    <div className="flex justify-between items-start">
      <Sk className="w-9 h-9 rounded-xl" />
      <Sk className="w-10 h-4 rounded-full" />
    </div>
    <Sk className="w-12 h-7 rounded-md" />
    <Sk className="w-24 h-4 rounded-md" />
  </div>
);

const QuickActionSkeleton = () => (
  <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
    <Sk className="w-12 h-12 rounded-2xl" />
    <Sk className="w-32 h-5 rounded-md" />
    <div className="flex justify-between items-center">
      <Sk className="w-40 h-4 rounded-md" />
      <Sk className="w-5 h-5 rounded-full" />
    </div>
  </div>
);

export default function GlobalSkeleton() {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      {/* Icon Sidebar */}
      <aside className="w-14 bg-white border-r border-gray-100 flex flex-col items-center py-5 gap-6 shrink-0">
        {Array.from({ length: 7 }).map((_, i) => (
          <Sk key={i} className="w-7 h-7 rounded-lg" />
        ))}
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-auto">

        {/* Topbar */}
        <header className="h-14 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between px-6 shrink-0">
          <Sk className="w-36 h-6 rounded-lg bg-white/30" />
          <div className="flex items-center gap-4">
            <Sk className="w-8 h-8 rounded-full bg-white/30" />
            <Sk className="w-28 h-6 rounded-lg bg-white/30" />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 space-y-6">

          {/* Top meta row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sk className="w-40 h-10 rounded-xl" />
              <Sk className="w-44 h-10 rounded-xl" />
            </div>
            <div className="flex items-center gap-3">
              <Sk className="w-8 h-8 rounded-full" />
              <Sk className="w-28 h-5 rounded-md" />
            </div>
          </div>

          {/* Greeting */}
          <div className="space-y-2">
            <Sk className="w-56 h-8 rounded-md" />
            <Sk className="w-72 h-6 rounded-md" />
            <Sk className="w-48 h-4 rounded-md" />
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>

          {/* Quick action cards */}
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <QuickActionSkeleton key={i} />
            ))}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-5 space-y-4">
            <Sk className="w-36 h-5 rounded-md" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Sk className="w-9 h-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Sk className="w-48 h-4 rounded-md" />
                  <Sk className="w-32 h-3 rounded-md" />
                </div>
                <Sk className="w-16 h-4 rounded-full" />
              </div>
            ))}
          </div>

        </main>
      </div>
    </div>
  );
}