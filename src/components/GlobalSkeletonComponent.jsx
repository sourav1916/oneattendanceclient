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
      <aside className="hidden w-14 shrink-0 flex-col items-center gap-6 border-r border-gray-100 bg-white py-5 md:flex">
        {Array.from({ length: 7 }).map((_, i) => (
          <Sk key={i} className="w-7 h-7 rounded-lg" />
        ))}
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-auto">

        {/* Topbar */}
        <header className="h-14 shrink-0 bg-white flex items-center justify-between px-3 sm:px-6">
          <Sk className="w-36 h-6 rounded-lg bg-white/30" />
          <div className="flex items-center gap-4">
            <Sk className="w-8 h-8 rounded-full bg-white/30" />
            <Sk className="hidden w-28 h-6 rounded-lg bg-white/30 sm:block" />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 space-y-4 p-3 sm:space-y-6 sm:p-6">

          {/* Top meta row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Sk className="h-10 w-32 rounded-xl sm:w-40" />
              <Sk className="h-10 w-36 rounded-xl sm:w-44" />
            </div>
            <div className="flex items-center gap-3">
              <Sk className="w-8 h-8 rounded-full" />
              <Sk className="w-24 h-5 rounded-md sm:w-28" />
            </div>
          </div>

          {/* Greeting */}
          <div className="space-y-2">
            <Sk className="h-8 w-44 rounded-md sm:w-56" />
            <Sk className="h-6 w-full max-w-[18rem] rounded-md sm:max-w-[24rem]" />
            <Sk className="h-4 w-40 rounded-md sm:w-48" />
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>

          {/* Quick action cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                  <Sk className="h-4 w-full max-w-[12rem] rounded-md sm:max-w-[16rem]" />
                  <Sk className="h-3 w-24 rounded-md sm:w-32" />
                </div>
                <Sk className="hidden h-4 w-16 rounded-full sm:block" />
              </div>
            ))}
          </div>

        </main>
      </div>
    </div>
  );
}
