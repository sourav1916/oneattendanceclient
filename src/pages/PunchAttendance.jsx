import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; 

const PunchAttendance = () => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Attendance System
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PunchAttendance;