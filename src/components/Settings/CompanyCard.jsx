import React from "react";
import { FaEdit, FaTrash } from "react-icons/fa";

function CompanyCard({ company, isActive, onSwitch, onEdit, onDelete }) {
  return (
    <div
      className={`flex justify-between items-center p-4 border rounded-lg transition-all duration-200
      ${isActive ? "border-indigo-500 bg-indigo-50 shadow-sm" : "border-gray-200 hover:bg-gray-50"}`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900">{company.name || "Unnamed Company"}</p>
          {isActive && (
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
              Active
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{company.legal_name || "No legal name"}</p>
        {(company.city || company.state) && (
          <p className="text-xs text-gray-400 mt-1">
            {[company.city, company.state].filter(Boolean).join(", ")}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onSwitch(company)}
          className="text-sm bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors font-medium text-gray-700"
        >
          Switch
        </button>

        <button
          onClick={() => onEdit(company)}
          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
          title="Edit Company"
        >
          <FaEdit className="w-4 h-4" />
        </button>

        <button
          onClick={() => onDelete(company)}
          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          title="Delete Company"
        >
          <FaTrash className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default CompanyCard;