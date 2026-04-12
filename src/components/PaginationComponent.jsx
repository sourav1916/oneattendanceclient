import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
    FaChevronLeft, 
    FaChevronRight, 
    FaAngleDoubleLeft, 
    FaAngleDoubleRight,
    FaLevelDownAlt 
} from 'react-icons/fa';

const Pagination = ({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    onLimitChange,
    availableLimits = [10, 20, 50, 100],
    className = '',
    showInfo = true,
}) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    const [jumpPage, setJumpPage] = useState('');

    useEffect(() => {
        setJumpPage(String(currentPage));
    }, [currentPage]);

    const handleJump = (e) => {
        e.preventDefault();
        const page = Number.parseInt(jumpPage, 10);
        if (page && page >= 1 && page <= totalPages) {
            onPageChange(page);
        } else {
            setJumpPage(String(currentPage));
        }
    };

    const getPageNumbers = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];
        let l;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
                range.push(i);
            }
        }

        range.forEach((i) => {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        });

        return rangeWithDots;
    };

    if (totalItems === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col lg:flex-row items-center justify-between gap-4 w-full bg-white p-4 rounded-xl border border-slate-200 mt-6 ${className}`.trim()}
        >
            {/* Left: Showing Info */}
            <div className="flex-shrink-0">
                {showInfo && (
                    <p className="text-sm text-slate-600 font-medium">
                        Showing <span className="text-slate-900 font-semibold">{startItem} to {endItem}</span> of <span className="text-slate-900 font-semibold">{totalItems} results</span>
                    </p>
                )}
            </div>

            {/* Middle Left: Show Limit Dropdown */}
            {onLimitChange && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 font-medium">Show:</span>
                    <div className="relative">
                        <select
                            value={itemsPerPage}
                            onChange={(e) => onLimitChange(Number(e.target.value))}
                            className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                        >
                            {availableLimits.map(limit => (
                                <option key={limit} value={limit}>{limit}</option>
                            ))}
                        </select>
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <FaChevronLeft className="rotate-[270deg]" size={10} />
                        </div>
                    </div>
                </div>
            )}

            {/* Center: Pagination Controls */}
            <div className="flex items-center gap-1">
                {/* First Page */}
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="First Page"
                >
                    <FaAngleDoubleLeft size={12} />
                </button>

                {/* Previous Page */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Previous Page"
                >
                    <FaChevronLeft size={12} />
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1 px-1">
                    {getPageNumbers().map((page, idx) => (
                        page === '...' ? (
                            <span key={`dots-${idx}`} className="px-2 text-slate-400">...</span>
                        ) : (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                className={`
                                    min-w-[36px] h-9 rounded-lg text-sm font-bold transition-all
                                    ${currentPage === page
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-600'
                                    }
                                `}
                            >
                                {page}
                            </button>
                        )
                    ))}
                </div>

                {/* Next Page */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Next Page"
                >
                    <FaChevronRight size={12} />
                </button>

                {/* Last Page */}
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Last Page"
                >
                    <FaAngleDoubleRight size={12} />
                </button>
            </div>

            {/* Right: Go to Page */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 font-medium">Go to:</span>
                <form onSubmit={handleJump} className="relative group">
                    <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={jumpPage}
                        onChange={(e) => setJumpPage(e.target.value)}
                        placeholder="Page No"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 pr-10 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-center"
                    />
                    <button
                        type="submit"
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-all opacity-0 group-focus-within:opacity-100"
                    >
                        <FaLevelDownAlt size={10} className="rotate-90" />
                    </button>
                </form>
                <span className="text-sm text-slate-500 font-medium">of <span className="text-slate-900 font-bold">{totalPages}</span> pages</span>
            </div>
        </motion.div>
    );
};

// Hook for pagination logic
export const usePagination = (initialPage = 1, initialLimit = 10) => {
    const [pagination, setPagination] = useState({
        page: initialPage,
        limit: initialLimit,
        total: 0,
        total_pages: 1,
        is_last_page: true
    });

    const updatePagination = useCallback((data) => {
        setPagination(prev => {
            const page = data.page || prev.page;
            const limit = data.limit || prev.limit;
            const total = data.total ?? prev.total;
            const total_pages = data.total_pages || Math.ceil(total / limit) || 1;
            
            return {
                page,
                limit,
                total,
                total_pages,
                is_last_page: data.is_last_page ?? (page >= total_pages)
            };
        });
    }, []);

    const goToPage = useCallback((page) => {
        setPagination(prev => ({ ...prev, page }));
    }, []);

    const changeLimit = useCallback((limit) => {
        setPagination(prev => ({ ...prev, limit, page: 1 }));
    }, []);

    const resetPagination = useCallback(() => {
        setPagination({
            page: initialPage,
            limit: initialLimit,
            total: 0,
            total_pages: 1,
            is_last_page: true
        });
    }, [initialPage, initialLimit]);

    return {
        pagination,
        updatePagination,
        goToPage,
        changeLimit,
        resetPagination
    };
};

export default Pagination;
