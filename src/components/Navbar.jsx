const Navbar = () => {
  return (
    <div className="h-16 bg-white shadow flex items-center justify-between px-6">
      
      {/* Left */}
      <h2 className="text-xl font-semibold text-slate-700">
        Dashboard
      </h2>

      {/* Right */}
      <div className="flex items-center gap-4">
        <button className="relative">
          🔔
          <span className="absolute -top-1 -right-2 bg-red-500 text-xs text-white rounded-full px-1">
            3
          </span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
            S
          </div>
          <span className="text-slate-600 font-medium">
            Subham
          </span>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
