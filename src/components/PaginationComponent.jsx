import React from 'react';
import { motion } from 'framer-motion';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Pagination = ({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    className = '',
    showInfo = true,
    variant = 'default' // 'default', 'compact', 'minimal'
}) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    const isFirstPage = currentPage === 1;
    const isLastPage = currentPage === totalPages;
    const canShowPageStrip = variant !== 'minimal' && totalPages > 1;

    const handlePrevious = () => {
        if (!isFirstPage) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (!isLastPage) {
            onPageChange(currentPage + 1);
        }
    };

    const handlePageClick = (page) => {
        onPageChange(page);
    };

    // Generate page numbers to display
    const getPageNumbers = () => {
        const delta = variant === 'compact' ? 1 : 2;
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_-26px_rgba(15,23,42,0.35)] ${className}`.trim()}
        >
            <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="min-w-0">
                    {showInfo && totalItems > 0 ? (
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
                            <span className="font-medium text-slate-500">Showing</span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                {startItem} - {endItem}
                            </span>
                            <span className="font-medium text-slate-500">of</span>
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                {totalItems}
                            </span>
                            <span className="font-medium text-slate-500">results</span>
                        </div>
                    ) : (
                        <div className="text-sm font-medium text-slate-500">
                            Page <span className="text-slate-800">{currentPage}</span> of{' '}
                            <span className="text-slate-800">{totalPages}</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={handlePrevious}
                            disabled={isFirstPage}
                            className={`
                                inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all duration-200
                                ${isFirstPage
                                    ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                                    : 'border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950'
                                }
                            `}
                            aria-label="Previous page"
                        >
                            <FaChevronLeft size={11} />
                            <span>Prev</span>
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={isLastPage}
                            className={`
                                inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all duration-200
                                ${isLastPage
                                    ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                                    : 'border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950'
                                }
                            `}
                            aria-label="Next page"
                        >
                            <span>Next</span>
                            <FaChevronRight size={11} />
                        </button>
                    </div>

                    {canShowPageStrip && (
                        <div className="max-w-full overflow-x-auto">
                            <div className="flex min-w-max items-center gap-1.5 rounded-xl bg-slate-50 p-1">
                                {totalPages <= 10 ? (
                                    getPageNumbers().map((page, index) => (
                                        page === '...' ? (
                                            <span
                                                key={`dots-${index}`}
                                                className="px-3 py-2 text-sm font-semibold tracking-wide text-slate-400"
                                            >
                                                ...
                                            </span>
                                        ) : (
                                            <button
                                                key={page}
                                                onClick={() => handlePageClick(page)}
                                                className={`
                                                    min-w-10 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200
                                                    ${currentPage === page
                                                        ? 'bg-slate-900 text-white shadow-md'
                                                        : 'text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow-sm'
                                                    }
                                                `}
                                                aria-current={currentPage === page ? 'page' : undefined}
                                            >
                                                {page}
                                            </button>
                                        )
                                    ))
                                ) : (
                                    <span className="min-w-10 rounded-lg bg-slate-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-md">
                                        {currentPage}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// Hook for pagination logic
export const usePagination = (initialPage = 1, initialLimit = 20) => {
    const [pagination, setPagination] = React.useState({
        page: initialPage,
        limit: initialLimit,
        total: 0,
        total_pages: 1,
        is_last_page: true
    });

    const updatePagination = React.useCallback((data) => {
        setPagination({
            page: data.page || pagination.page,
            limit: data.limit || pagination.limit,
            total: data.total || pagination.total,
            total_pages: data.total_pages || pagination.total_pages,
            is_last_page: data.is_last_page ?? (data.page === data.total_pages)
        });
    }, [pagination.page, pagination.limit, pagination.total, pagination.total_pages]);

    const goToPage = React.useCallback((page) => {
        setPagination(prev => ({ ...prev, page }));
    }, []);

    const goToNextPage = React.useCallback(() => {
        if (!pagination.is_last_page) {
            setPagination(prev => ({ ...prev, page: prev.page + 1 }));
        }
    }, [pagination.is_last_page]);

    const goToPrevPage = React.useCallback(() => {
        if (pagination.page > 1) {
            setPagination(prev => ({ ...prev, page: prev.page - 1 }));
        }
    }, [pagination.page]);

    const resetPagination = React.useCallback(() => {
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
        goToNextPage,
        goToPrevPage,
        resetPagination
    };
};

export default Pagination;
