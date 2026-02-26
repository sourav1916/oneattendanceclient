import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const WorkingHoursSummary = () => {
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('weekly'); // 'daily', 'weekly', 'monthly'
  const [summaryData, setSummaryData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Dummy data
      const data = {
        daily: {
          date: '2024-02-26',
          scheduled: 8,
          actual: 8.5,
          overtime: 0.5,
          breakdown: [
            { hour: '9AM', value: 1 },
            { hour: '10AM', value: 1 },
            { hour: '11AM', value: 1 },
            { hour: '12PM', value: 1 },
            { hour: '1PM', value: 0.5 },
            { hour: '2PM', value: 1 },
            { hour: '3PM', value: 1 },
            { hour: '4PM', value: 1 },
            { hour: '5PM', value: 1 }
          ]
        },
        weekly: {
          week: 'Feb 19 - Feb 25, 2024',
          scheduled: 40,
          actual: 42.5,
          overtime: 2.5,
          days: [
            { day: 'Mon', date: '19', hours: 8.5, target: 8 },
            { day: 'Tue', date: '20', hours: 9, target: 8 },
            { day: 'Wed', date: '21', hours: 8, target: 8 },
            { day: 'Thu', date: '22', hours: 8.5, target: 8 },
            { day: 'Fri', date: '23', hours: 8.5, target: 8 },
            { day: 'Sat', date: '24', hours: 0, target: 0 },
            { day: 'Sun', date: '25', hours: 0, target: 0 }
          ]
        },
        monthly: {
          month: 'February 2024',
          scheduled: 160,
          actual: 172.5,
          overtime: 12.5,
          weeks: [
            { week: 'Week 1', hours: 42, target: 40 },
            { week: 'Week 2', hours: 43.5, target: 40 },
            { week: 'Week 3', hours: 44, target: 40 },
            { week: 'Week 4', hours: 43, target: 40 }
          ],
          summary: {
            totalDays: 21,
            presentDays: 20,
            absentDays: 1,
            lateDays: 2,
            avgDaily: 8.2
          }
        },
        overtime: {
          total: 15.5,
          paid: 12,
          remaining: 3.5,
          monthly: [
            { month: 'Jan', hours: 8 },
            { month: 'Feb', hours: 12.5 },
            { month: 'Mar', hours: 10 },
            { month: 'Apr', hours: 7 },
            { month: 'May', hours: 9 },
            { month: 'Jun', hours: 11 }
          ]
        }
      };

      setSummaryData(data);
      setLoading(false);
    };

    fetchData();
  }, []);

  // Calculate percentage for progress bars
  const getPercentage = (actual, target) => {
    return Math.min((actual / target) * 100, 100);
  };

  // Format hours
  const formatHours = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-12 w-64 bg-slate-200 rounded-lg mb-8 animate-pulse"></div>
          
          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-2xl animate-pulse"></div>
            ))}
          </div>
          
          {/* Chart skeleton */}
          <div className="h-96 bg-white rounded-2xl animate-pulse mb-8"></div>
          
          {/* Table skeleton */}
          <div className="h-64 bg-white rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Working Hours Summary
            </span>
          </h1>
          <p className="text-lg text-slate-600">Track your daily, weekly and monthly working hours</p>
        </motion.div>

        {/* Timeframe selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-2 inline-flex shadow-sm mb-8"
        >
          {['daily', 'weekly', 'monthly'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-6 py-2 rounded-xl font-medium capitalize transition-all ${
                timeframe === tf
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tf}
            </button>
          ))}
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          {/* Scheduled Hours */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500 mb-1">Scheduled Hours</p>
            <p className="text-3xl font-bold text-slate-800">
              {timeframe === 'daily' 
                ? summaryData?.daily.scheduled 
                : timeframe === 'weekly' 
                  ? summaryData?.weekly.scheduled 
                  : summaryData?.monthly.scheduled}h
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {timeframe === 'daily' ? 'Today' : timeframe === 'weekly' ? 'This week' : 'This month'}
            </p>
          </div>

          {/* Actual Hours */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500 mb-1">Actual Hours</p>
            <p className="text-3xl font-bold text-blue-600">
              {timeframe === 'daily' 
                ? summaryData?.daily.actual 
                : timeframe === 'weekly' 
                  ? summaryData?.weekly.actual 
                  : summaryData?.monthly.actual}h
            </p>
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ 
                  width: `${getPercentage(
                    timeframe === 'daily' ? summaryData?.daily.actual : 
                    timeframe === 'weekly' ? summaryData?.weekly.actual : 
                    summaryData?.monthly.actual,
                    timeframe === 'daily' ? summaryData?.daily.scheduled : 
                    timeframe === 'weekly' ? summaryData?.weekly.scheduled : 
                    summaryData?.monthly.scheduled
                  )}%` 
                }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-blue-600 rounded-full"
              />
            </div>
          </div>

          {/* Overtime */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500 mb-1">Overtime</p>
            <p className="text-3xl font-bold text-amber-600">
              {timeframe === 'daily' 
                ? summaryData?.daily.overtime 
                : timeframe === 'weekly' 
                  ? summaryData?.weekly.overtime 
                  : summaryData?.monthly.overtime}h
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {timeframe === 'daily' ? '+30 min extra' : '+2.5 hrs this week'}
            </p>
          </div>

          {/* Efficiency */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500 mb-1">Efficiency</p>
            <p className="text-3xl font-bold text-green-600">
              {Math.round(
                ((timeframe === 'daily' ? summaryData?.daily.actual : 
                  timeframe === 'weekly' ? summaryData?.weekly.actual : 
                  summaryData?.monthly.actual) / 
                (timeframe === 'daily' ? summaryData?.daily.scheduled : 
                  timeframe === 'weekly' ? summaryData?.weekly.scheduled : 
                  summaryData?.monthly.scheduled)) * 100
              )}%
            </p>
            <p className="text-xs text-slate-400 mt-1">Above target</p>
          </div>
        </motion.div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main chart - 2/3 width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
          >
            <h3 className="text-lg font-semibold text-slate-700 mb-6">
              {timeframe === 'daily' && 'Today\'s Hourly Breakdown'}
              {timeframe === 'weekly' && 'Weekly Hours by Day'}
              {timeframe === 'monthly' && 'Monthly Hours by Week'}
            </h3>

            {timeframe === 'daily' && (
              <div className="space-y-4">
                {summaryData?.daily.breakdown.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className="text-sm text-slate-500 w-16">{item.hour}</span>
                    <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.value / 1) * 100}%` }}
                        transition={{ delay: index * 0.05, duration: 0.5 }}
                        className="h-full bg-blue-600 rounded-lg"
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-700 w-16">{item.value}h</span>
                  </div>
                ))}
              </div>
            )}

            {timeframe === 'weekly' && (
              <div className="space-y-4">
                {summaryData?.weekly.days.map((day, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className="text-sm text-slate-500 w-16">{day.day}</span>
                    <span className="text-xs text-slate-400 w-12">{day.date}</span>
                    <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(day.hours / 10) * 100}%` }}
                        transition={{ delay: index * 0.05, duration: 0.5 }}
                        className={`h-full rounded-lg ${
                          day.hours > day.target ? 'bg-amber-600' : 'bg-blue-600'
                        }`}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-700 w-20">
                      {day.hours}h / {day.target}h
                    </span>
                  </div>
                ))}
              </div>
            )}

            {timeframe === 'monthly' && (
              <div className="space-y-4">
                {summaryData?.monthly.weeks.map((week, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className="text-sm text-slate-500 w-20">{week.week}</span>
                    <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(week.hours / 45) * 100}%` }}
                        transition={{ delay: index * 0.05, duration: 0.5 }}
                        className={`h-full rounded-lg ${
                          week.hours > week.target ? 'bg-amber-600' : 'bg-blue-600'
                        }`}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-700 w-24">
                      {week.hours}h / {week.target}h
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Overtime summary - 1/3 width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
          >
            <h3 className="text-lg font-semibold text-slate-700 mb-6">Overtime Summary</h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Total Overtime</span>
                  <span className="font-semibold text-slate-800">{summaryData?.overtime.total}h</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '75%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-blue-600 rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Paid Overtime</span>
                  <span className="font-semibold text-slate-800">{summaryData?.overtime.paid}h</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(summaryData?.overtime.paid / summaryData?.overtime.total) * 100}%` }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="h-full bg-green-600 rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Remaining</span>
                  <span className="font-semibold text-slate-800">{summaryData?.overtime.remaining}h</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(summaryData?.overtime.remaining / summaryData?.overtime.total) * 100}%` }}
                    transition={{ duration: 1, delay: 0.7 }}
                    className="h-full bg-amber-600 rounded-full"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-500 mb-3">Monthly Overtime Trend</p>
                <div className="flex items-end justify-between h-24 gap-1">
                  {summaryData?.overtime.monthly.map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(item.hours / 15) * 100}%` }}
                        transition={{ delay: index * 0.05, duration: 0.5 }}
                        className="w-full bg-blue-600 rounded-t-lg"
                        style={{ maxHeight: '100%' }}
                      />
                      <span className="text-xs text-slate-500 mt-2">
                        {item.month}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Monthly Summary Table */}
        {timeframe === 'monthly' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
          >
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Monthly Breakdown</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500 mb-1">Total Days</p>
                <p className="text-2xl font-bold text-slate-800">{summaryData?.monthly.summary.totalDays}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500 mb-1">Present</p>
                <p className="text-2xl font-bold text-green-600">{summaryData?.monthly.summary.presentDays}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500 mb-1">Absent</p>
                <p className="text-2xl font-bold text-rose-600">{summaryData?.monthly.summary.absentDays}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500 mb-1">Late</p>
                <p className="text-2xl font-bold text-amber-600">{summaryData?.monthly.summary.lateDays}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500 mb-1">Avg Daily</p>
                <p className="text-2xl font-bold text-blue-600">{summaryData?.monthly.summary.avgDaily}h</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Daily/Weekly summary */}
        {(timeframe === 'daily' || timeframe === 'weekly') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-700 mb-4">Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Scheduled Hours</span>
                  <span className="font-semibold">
                    {timeframe === 'daily' ? summaryData?.daily.scheduled : summaryData?.weekly.scheduled}h
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Actual Hours</span>
                  <span className="font-semibold text-blue-600">
                    {timeframe === 'daily' ? summaryData?.daily.actual : summaryData?.weekly.actual}h
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Overtime</span>
                  <span className="font-semibold text-amber-600">
                    {timeframe === 'daily' ? summaryData?.daily.overtime : summaryData?.weekly.overtime}h
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">Efficiency</span>
                  <span className="font-semibold text-green-600">
                    {Math.round(
                      ((timeframe === 'daily' ? summaryData?.daily.actual : summaryData?.weekly.actual) /
                      (timeframe === 'daily' ? summaryData?.daily.scheduled : summaryData?.weekly.scheduled)) * 100
                    )}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-700 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Average per day</span>
                  <span className="font-semibold">
                    {timeframe === 'daily' 
                      ? summaryData?.daily.actual 
                      : (summaryData?.weekly.actual / 5).toFixed(1)}h
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Peak hour</span>
                  <span className="font-semibold">
                    {timeframe === 'daily' ? '3PM (1h)' : 'Wednesday (9h)'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">Compared to last {timeframe === 'daily' ? 'day' : 'week'}</span>
                  <span className="font-semibold text-green-600">+0.5h</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-slate-400 mt-8"
        >
          Data updates in real-time • Last sync: Just now
        </motion.p>
      </div>
    </div>
  );
};

export default WorkingHoursSummary;