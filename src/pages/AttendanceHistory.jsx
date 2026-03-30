import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaCalendarAlt,
  FaChartLine,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaExclamationCircle,
  FaEye,
  FaHistory,
  FaHourglassEnd,
  FaHourglassStart,
  FaMapMarkerAlt,
  FaSearch,
  FaSignInAlt,
  FaSignOutAlt,
  FaStickyNote,
  FaTimes,
  FaTimesCircle
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const generateMockAttendance = () => {
  const statuses = ['Present', 'Absent', 'Late', 'Half Day', 'Holiday', 'Present', 'Present', 'Late', 'Present', 'Absent'];
  const clockInTimes = ['09:00 AM', '09:15 AM', '09:45 AM', '10:00 AM', '08:55 AM', '09:10 AM', '09:30 AM', '09:05 AM', '09:20 AM', '08:45 AM'];
  const clockOutTimes = ['06:00 PM', '06:30 PM', '06:15 PM', '05:45 PM', '06:00 PM', '07:00 PM', '06:20 PM', '06:10 PM', '05:55 PM', '06:45 PM'];
  const locations = ['Office Main', 'Remote - Home', 'Client Site', 'Office - Branch', 'Remote'];
  const records = [];

  for (let index = 0; index < 52; index += 1) {
    const date = new Date(2025, 0, 1);
    date.setDate(date.getDate() + index * 2);

    if (date > new Date()) {
      break;
    }

    const randomIndex = Math.floor(Math.random() * statuses.length);
    const status = statuses[randomIndex];
    const isPresent = ['Present', 'Late', 'Half Day'].includes(status);
    const workedHours = isPresent ? `${(Math.random() * 5 + 4).toFixed(1)} hrs` : '0 hrs';

    records.push({
      id: index + 1,
      date: date.toISOString().split('T')[0],
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      clock_in: isPresent ? clockInTimes[Math.floor(Math.random() * clockInTimes.length)] : '--:-- --',
      clock_out: isPresent ? clockOutTimes[Math.floor(Math.random() * clockOutTimes.length)] : '--:-- --',
      status,
      location: isPresent ? locations[Math.floor(Math.random() * locations.length)] : '-',
      worked_hours: workedHours,
      overtime: isPresent && Math.random() > 0.7 ? '0.5 hrs' : '0 hrs',
      notes:
        status === 'Late'
          ? 'Traffic delay'
          : status === 'Absent'
            ? 'Unplanned leave'
            : status === 'Half Day'
              ? 'Personal reasons'
              : 'Regular shift'
    });
  }

  return records.sort((left, right) => new Date(right.date) - new Date(left.date));
};

const allAttendanceRecords = generateMockAttendance();

const fetchAttendanceAPI = async ({ page, limit, search, status }) =>
  new Promise((resolve) => {
    setTimeout(() => {
      let filtered = [...allAttendanceRecords];

      if (search) {
        const searchValue = search.toLowerCase();
        filtered = filtered.filter((record) =>
          record.date.includes(search)
          || record.status.toLowerCase().includes(searchValue)
          || record.location.toLowerCase().includes(searchValue)
        );
      }

      if (status !== 'all') {
        filtered = filtered.filter((record) => record.status.toLowerCase() === status.toLowerCase());
      }

      const total = filtered.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;

      resolve({
        data: filtered.slice(startIndex, startIndex + limit),
        current_page: page,
        per_page: limit,
        total,
        last_page: totalPages || 1,
        success: true
      });
    }, 400);
  });

const formatDateFull = (dateValue) => {
  if (!dateValue) {
    return 'N/A';
  }

  return new Date(dateValue).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatTime = (timeValue) => timeValue || '-';

const getStatusBadge = (status) => {
  switch (status?.toLowerCase()) {
    case 'present':
      return { icon: FaCheckCircle, className: 'bg-green-100 text-green-800 border border-green-200' };
    case 'absent':
      return { icon: FaTimesCircle, className: 'bg-red-100 text-red-800 border border-red-200' };
    case 'late':
      return { icon: FaClock, className: 'bg-amber-100 text-amber-800 border border-amber-200' };
    case 'half day':
      return { icon: FaHourglassStart, className: 'bg-orange-100 text-orange-800 border border-orange-200' };
    case 'holiday':
      return { icon: FaCalendarAlt, className: 'bg-purple-100 text-purple-800 border border-purple-200' };
    default:
      return { icon: FaExclamationCircle, className: 'bg-gray-100 text-gray-700 border border-gray-200' };
  }
};

const usePagination = (initialPage = 1, perPage = 8) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(perPage);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const goToPage = (nextPage) => {
    if (nextPage >= 1 && nextPage <= totalPages) {
      setPage(nextPage);
    }
  };

  const updatePagination = ({ page: currentPage, limit: currentLimit, total: totalItems, total_pages: pages }) => {
    setPage(currentPage);
    setLimit(currentLimit);
    setTotal(totalItems);
    setTotalPages(pages);
  };

  return {
    pagination: { page, limit, total, totalPages },
    updatePagination,
    goToPage
  };
};

const PaginationComponent = ({ currentPage, totalItems, itemsPerPage, totalPages, onPageChange }) => {
  if (totalItems <= 0) {
    return null;
  }

  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  const pages = [];
  for (let pageNumber = startPage; pageNumber <= endPage; pageNumber += 1) {
    pages.push(pageNumber);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mt-8">
      <div className="rounded-full bg-white px-4 py-2 text-sm text-gray-500 shadow-sm">
        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm transition-all hover:bg-purple-50 disabled:opacity-50"
        >
          <FaChevronLeft className="mr-1 inline text-xs" />
          Prev
        </button>

        {pages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            className={`h-10 w-10 rounded-xl text-sm font-medium shadow-sm transition-all ${
              pageNumber === currentPage
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                : 'border border-gray-200 bg-white text-gray-700 hover:bg-purple-50'
            }`}
          >
            {pageNumber}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm transition-all hover:bg-purple-50 disabled:opacity-50"
        >
          Next
          <FaChevronRight className="ml-1 inline text-xs" />
        </button>
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value }) => (
  <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-4">
    <label className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
      {icon}
      {label}
    </label>
    <div className="text-sm font-medium text-gray-800 md:text-base">{value || '-'}</div>
  </div>
);

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', duration: 0.5 } },
  exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.3 } }
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const DetailsModal = ({ record, onClose }) => {
  if (!record) {
    return null;
  }

  const statusStyle = getStatusBadge(record.status);
  const StatusIcon = statusStyle.icon;

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="sticky top-0 flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <FaEye />
              Attendance Details
            </h2>
            <button type="button" onClick={onClose} className="rounded-xl p-2 transition hover:bg-white/20">
              <FaTimes size={20} />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b pb-5">
              <div>
                <h3 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
                  {formatDateFull(record.date)}
                  <span className="text-sm font-normal text-gray-500">({record.day})</span>
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusStyle.className}`}>
                    <StatusIcon size={12} />
                    {record.status}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-gray-100 p-3 text-center">
                <FaChartLine className="mx-auto text-xl text-purple-500" />
                <p className="mt-1 text-xs text-gray-500">Work Hours</p>
                <p className="font-bold">{record.worked_hours}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <InfoItem icon={<FaHourglassStart className="text-blue-500" />} label="Clock In" value={formatTime(record.clock_in)} />
              <InfoItem icon={<FaHourglassEnd className="text-red-500" />} label="Clock Out" value={formatTime(record.clock_out)} />
              <InfoItem icon={<FaMapMarkerAlt className="text-green-500" />} label="Location" value={record.location || '-'} />
              <InfoItem icon={<FaChartLine className="text-orange-500" />} label="Overtime" value={record.overtime || '0 hrs'} />
              <InfoItem icon={<FaStickyNote className="text-gray-500" />} label="Notes" value={record.notes || '-'} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const SkeletonLoader = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4].map((item) => (
      <div key={item} className="animate-pulse rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex justify-between">
          <div className="h-5 w-1/3 rounded bg-gray-200" />
          <div className="h-5 w-20 rounded bg-gray-200" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-200" />
        </div>
      </div>
    ))}
  </div>
);

const AttendanceHistory = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  const fetchInProgress = useRef(false);
  const initialFetchDone = useRef(false);
  const { pagination, updatePagination, goToPage } = usePagination(1, 6);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchAttendance = useCallback(
    async (page = pagination.page, resetLoading = true) => {
      if (fetchInProgress.current) {
        return;
      }

      fetchInProgress.current = true;

      if (resetLoading) {
        setLoading(true);
      }

      try {
        const result = await fetchAttendanceAPI({
          page,
          limit: pagination.limit,
          search: debouncedSearch,
          status: statusFilter
        });

        if (!result.success) {
          throw new Error('Failed to fetch records');
        }

        setRecords(result.data);
        updatePagination({
          page: result.current_page,
          limit: result.per_page,
          total: result.total,
          total_pages: result.last_page
        });
        setError(null);
      } catch (fetchError) {
        setError(fetchError.message);
        toast.error(fetchError.message || 'Failed to load attendance.');
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
        fetchInProgress.current = false;
      }
    },
    [debouncedSearch, pagination.limit, pagination.page, statusFilter, updatePagination]
  );

  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchAttendance(1, true);
      initialFetchDone.current = true;
    }
  }, [fetchAttendance]);

  useEffect(() => {
    if (!isInitialLoad && !fetchInProgress.current && initialFetchDone.current) {
      fetchAttendance(pagination.page, true);
    }
  }, [fetchAttendance, isInitialLoad, pagination.page]);

  useEffect(() => {
    if (!isInitialLoad) {
      if (pagination.page !== 1) {
        goToPage(1);
      } else {
        fetchAttendance(1, true);
      }
    }
  }, [debouncedSearch, fetchAttendance, goToPage, isInitialLoad, pagination.page, statusFilter]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showClockOut = windowWidth >= 768;
  const showLocation = windowWidth >= 1024;
  const showOvertime = windowWidth >= 1280;

  const openDetails = (record) => {
    setSelectedRecord(record);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedRecord(null);
  };

  if (isInitialLoad && loading) {
    return (
      <div className="mx-auto min-h-screen max-w-7xl p-6">
        <SkeletonLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 font-sans md:p-6">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col items-center justify-between gap-3 sm:flex-row"
        >
          <h1 className="flex items-center gap-2 bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-2xl font-extrabold text-transparent md:text-3xl">
            <FaHistory className="text-purple-500" />
            Attendance History
          </h1>

          <div className="rounded-full bg-white px-5 py-2 text-sm text-gray-600 shadow-md">
            <FaCalendarAlt className="mr-2 inline text-purple-500" />
            Total Records: {pagination.total}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col gap-4 md:flex-row"
        >
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by date, status, location..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 shadow-md outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-300"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Filter:</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="half day">Half Day</option>
              <option value="holiday">Holiday</option>
            </select>
          </div>
        </motion.div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-red-700">
            <FaExclamationCircle />
            {error}
          </div>
        )}

        {!loading && records.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl md:block"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-xs uppercase text-gray-600">
                  <tr>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Day</th>
                    <th className="px-5 py-4">Clock In</th>
                    {showClockOut && <th className="px-5 py-4">Clock Out</th>}
                    <th className="px-5 py-4">Status</th>
                    {showLocation && <th className="px-5 py-4">Location</th>}
                    {showOvertime && <th className="px-5 py-4">Overtime</th>}
                    <th className="px-5 py-4 text-center">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {records.map((record, index) => {
                    const style = getStatusBadge(record.status);
                    const StatusIcon = style.icon;

                    return (
                      <motion.tr
                        key={record.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="transition duration-200 hover:bg-purple-50/40"
                      >
                        <td className="px-5 py-4 font-medium">{formatDateFull(record.date)}</td>
                        <td className="px-5 py-4 text-gray-500">{record.day}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1">
                            <FaSignInAlt className="text-xs text-green-500" />
                            {record.clock_in}
                          </span>
                        </td>
                        {showClockOut && (
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1">
                              <FaSignOutAlt className="text-xs text-red-400" />
                              {record.clock_out}
                            </span>
                          </td>
                        )}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${style.className}`}>
                            <StatusIcon size={12} />
                            {record.status}
                          </span>
                        </td>
                        {showLocation && <td className="px-5 py-4 text-gray-600">{record.location}</td>}
                        {showOvertime && <td className="px-5 py-4 text-gray-600">{record.overtime}</td>}
                        <td className="px-5 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => openDetails(record)}
                            className="rounded-xl bg-purple-50 p-2 text-purple-600 shadow-sm transition-all duration-200 hover:bg-purple-100 hover:text-purple-800"
                          >
                            <FaEye className="mr-1 inline" />
                            View
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {!loading && records.length > 0 && (
          <div className="grid grid-cols-1 gap-5 md:hidden">
            {records.map((record) => {
              const style = getStatusBadge(record.status);
              const StatusIcon = style.icon;

              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-hover rounded-2xl border border-gray-100 bg-white p-5 shadow-lg"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{formatDateFull(record.date)}</h3>
                      <p className="text-xs text-gray-500">{record.day}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${style.className}`}>
                      <StatusIcon size={12} />
                      {record.status}
                    </span>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <FaClock className="mr-1 inline text-purple-400" />
                      In: {record.clock_in}
                    </div>
                    <div>
                      <FaHourglassEnd className="mr-1 inline text-purple-400" />
                      Out: {record.clock_out}
                    </div>
                    <div className="col-span-2">
                      <FaMapMarkerAlt className="mr-1 inline text-gray-400" />
                      {record.location}
                    </div>
                    <div>
                      <FaChartLine className="mr-1 inline text-green-500" />
                      Overtime: {record.overtime}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openDetails(record)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 py-2.5 font-medium text-purple-700 transition hover:from-purple-100 hover:to-pink-100"
                  >
                    <FaEye />
                    View Full Details
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}

        {!loading && records.length === 0 && (
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="rounded-2xl bg-white py-16 text-center shadow-lg">
            <FaCalendarAlt className="mx-auto mb-4 text-6xl text-gray-300" />
            <p className="text-xl text-gray-500">No attendance records found</p>
            <p className="mt-1 text-gray-400">Try adjusting search or filter</p>
          </motion.div>
        )}

        {pagination.total > 0 && (
          <PaginationComponent
            currentPage={pagination.page}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            totalPages={pagination.totalPages}
            onPageChange={goToPage}
          />
        )}
      </div>

      <AnimatePresence>{modalOpen && selectedRecord && <DetailsModal record={selectedRecord} onClose={closeModal} />}</AnimatePresence>
    </div>
  );
};

export default AttendanceHistory;
