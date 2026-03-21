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
            className={`mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-6 py-4 rounded-2xl shadow-lg ${className}`}
        >
            {showInfo && totalItems > 0 && (
                <div className="text-sm text-gray-600">
                    Showing{' '}
                    <span className="font-semibold text-blue-600">{startItem}</span> to{' '}
                    <span className="font-semibold text-blue-600">{endItem}</span> of{' '}
                    <span className="font-semibold text-blue-600">{totalItems}</span> results
                </div>
            )}

            <div className="flex gap-2">
                <button
                    onClick={handlePrevious}
                    disabled={isFirstPage}
                    className={`
                        px-4 py-2 rounded-xl border flex items-center gap-2 transition-all duration-300
                        ${isFirstPage
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent'
                        }
                    `}
                >
                    <FaChevronLeft size={12} />
                    Previous
                </button>

                {variant !== 'minimal' && totalPages <= 10 ? (
                    <div className="flex gap-1">
                        {getPageNumbers().map((page, index) => (
                            page === '...' ? (
                                <span
                                    key={`dots-${index}`}
                                    className="px-4 py-2 text-gray-500"
                                >
                                    ...
                                </span>
                            ) : (
                                <button
                                    key={page}
                                    onClick={() => handlePageClick(page)}
                                    className={`
                                        px-4 py-2 rounded-xl transition-all duration-300 font-medium
                                        ${currentPage === page
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                        }
                                    `}
                                >
                                    {page}
                                </button>
                            )
                        ))}
                    </div>
                ) : variant !== 'minimal' && (
                    <span className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl min-w-[40px] text-center font-semibold shadow-md">
                        {currentPage}
                    </span>
                )}

                <button
                    onClick={handleNext}
                    disabled={isLastPage}
                    className={`
                        px-4 py-2 rounded-xl border flex items-center gap-2 transition-all duration-300
                        ${isLastPage
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent'
                        }
                    `}
                >
                    Next
                    <FaChevronRight size={12} />
                </button>
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