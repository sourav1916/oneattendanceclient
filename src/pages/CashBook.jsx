import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function CashbookPage() {
  return (
    <div className="p-6 min-h-screen">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Cashbook</h1>

        <button className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700">
          Add Entry
        </button>
      </div>


      {/* Card */}
      <div className="p-6">

        {/* Month Navigation */}
        <div className="flex justify-between items-center mb-6">

          <div className="flex items-center gap-4">
            <button className="p-2 rounded bg-slate-100">
              <FaChevronLeft />
            </button>

            <h2 className="text-lg font-medium">Mar, 2026</h2>

            <button className="p-2 rounded bg-slate-200">
              <FaChevronRight />
            </button>
          </div>

          <button className="border border-blue-500 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50">
            Download Report
          </button>

        </div>


        {/* Summary */}
        <div className="flex items-center gap-12 mb-16">

          <div>
            <p className="text-2xl font-semibold text-red-500">₹ 0.00</p>
            <p className="text-sm text-gray-500">Total Paid</p>
          </div>

          <div className="border-l h-10"></div>

          <div>
            <p className="text-2xl font-semibold text-green-600">₹ 0.00</p>
            <p className="text-sm text-gray-500">Total Received</p>
          </div>

        </div>


        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">

          <img
            src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
            className="w-16 mb-4 opacity-70"
          />

          <p className="text-lg">No Entries Available</p>

        </div>

      </div>
    </div>
  );
}
