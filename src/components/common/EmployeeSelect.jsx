import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaSearch, FaSpinner, FaChevronDown, FaUserCircle, FaTimes, FaCheck } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import apiCall from '../../utils/api';

const AVATAR_GRADIENTS = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-green-500 to-teal-600',
    'from-orange-500 to-amber-500',
    'from-rose-500 to-red-600',
    'from-cyan-500 to-blue-500',
];

const avatarGradient = (id) => AVATAR_GRADIENTS[id % AVATAR_GRADIENTS.length];

const getInitials = (name = '') =>
    name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

export default function EmployeeSelect({ 
    value, 
    onChange, 
    placeholder = "Select an employee...", 
    error,
    isMulti = false 
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    
    const dropdownRef = useRef(null);
    const listRef = useRef(null);

    // Maintain an array of selected employee objects
    const [selectedEmployees, setSelectedEmployees] = useState([]);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Fetch employees
    const fetchEmployees = useCallback(async (currentPage, search, append = false) => {
        if (!hasMore && append) return;
        setLoading(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '20'
            });
            if (search) params.append('search', search);

            const response = await apiCall(`/employees/list?${params}`, 'GET', null, company?.id);
            const result = await response.json();

            if (result.success) {
                const fetchedData = result.data || [];
                setEmployees(prev => append ? [...prev, ...fetchedData] : fetchedData);
                
                const meta = result.meta || result.pagination || {};
                const isLastPage = meta.is_last_page ?? (currentPage >= (meta.total_pages || 1));
                setHasMore(!isLastPage);
            }
        } catch (e) {
            console.error('Failed to load employees', e);
        } finally {
            setLoading(false);
        }
    }, [hasMore]);

    // Initial load and search changes
    useEffect(() => {
        if (isOpen) {
            fetchEmployees(page, debouncedSearch, page > 1);
        }
    }, [isOpen, debouncedSearch, page]);

    // Sync selected object(s) with value prop
    useEffect(() => {
        if (isMulti) {
            const valueArray = Array.isArray(value) ? value : [];
            if (valueArray.length === 0) {
                setSelectedEmployees([]);
            } else {
                // Keep existing selected objects, but add new ones from the current loaded list if they exist
                setSelectedEmployees(prev => {
                    const updated = [...prev];
                    valueArray.forEach(id => {
                        if (!updated.find(e => String(e.id) === String(id))) {
                            const found = employees.find(e => String(e.id) === String(id));
                            if (found) updated.push(found);
                        }
                    });
                    // Filter out any that were removed from the value prop
                    return updated.filter(e => valueArray.includes(e.id) || valueArray.includes(String(e.id)));
                });
            }
        } else {
            if (value) {
                if (selectedEmployees.length === 0 || String(selectedEmployees[0].id) !== String(value)) {
                    const existing = employees.find(e => String(e.id) === String(value));
                    if (existing) {
                        setSelectedEmployees([existing]);
                    }
                }
            } else {
                setSelectedEmployees([]);
            }
        }
    }, [value, employees, isMulti]);

    // Click outside handler
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleScroll = () => {
        if (!listRef.current || loading || !hasMore) return;
        const { scrollTop, scrollHeight, clientHeight } = listRef.current;
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            setPage(prev => prev + 1);
        }
    };

    const handleSelect = (emp) => {
        if (isMulti) {
            const isSelected = selectedEmployees.some(e => String(e.id) === String(emp.id));
            let newSelections;
            if (isSelected) {
                newSelections = selectedEmployees.filter(e => String(e.id) !== String(emp.id));
            } else {
                newSelections = [...selectedEmployees, emp];
            }
            setSelectedEmployees(newSelections);
            onChange(newSelections.map(e => e.id));
        } else {
            setSelectedEmployees([emp]);
            onChange(emp.id);
            setIsOpen(false);
            setSearchQuery('');
        }
    };

    const handleRemoveTag = (e, idToRemove) => {
        e.stopPropagation();
        if (isMulti) {
            const newSelections = selectedEmployees.filter(e => String(e.id) !== String(idToRemove));
            setSelectedEmployees(newSelections);
            onChange(newSelections.map(e => e.id));
        }
    };

    const handleClear = (e) => {
        e.stopPropagation();
        setSelectedEmployees([]);
        onChange(isMulti ? [] : '');
        setSearchQuery('');
    };

    const isEmployeeSelected = (id) => selectedEmployees.some(e => String(e.id) === String(id));

    // Render logic for the trigger content
    const renderTriggerContent = () => {
        if (selectedEmployees.length === 0) {
            return <span className="text-gray-400">{placeholder}</span>;
        }

        if (!isMulti) {
            const emp = selectedEmployees[0];
            return (
                <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${avatarGradient(emp.id)} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                        {getInitials(emp.name)}
                    </div>
                    <span className="font-semibold text-gray-800 truncate">{emp.name}</span>
                    <span className="text-xs text-gray-400 font-mono hidden sm:inline truncate">({emp.employee_code})</span>
                </div>
            );
        }

        // Multi-select render
        const MAX_TAGS = 3;
        const visibleTags = selectedEmployees.slice(0, MAX_TAGS);
        const hiddenCount = selectedEmployees.length - MAX_TAGS;

        return (
            <div className="flex flex-wrap items-center gap-1.5 w-full">
                {visibleTags.map(emp => (
                    <div key={emp.id} className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md max-w-[120px] sm:max-w-[150px]">
                        <span className="text-xs font-medium text-gray-700 truncate">{emp.name.split(' ')[0]}</span>
                        <button 
                            type="button" 
                            onClick={(e) => handleRemoveTag(e, emp.id)}
                            className="text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 p-0.5 transition-colors"
                        >
                            <FaTimes size={10} />
                        </button>
                    </div>
                ))}
                {hiddenCount > 0 && (
                    <span className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-2 py-1 rounded-md">
                        +{hiddenCount} more
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {/* Trigger Button */}
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full min-h-[44px] px-4 py-2 bg-white border ${error ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-200 hover:border-gray-300'} rounded-xl text-sm outline-none focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all flex items-center justify-between cursor-pointer`}
            >
                <div className="flex-1 min-w-0 pr-2 flex items-center">
                    {renderTriggerContent()}
                </div>
                <div className="flex items-center gap-2 shrink-0 border-l border-gray-100 pl-2">
                    {selectedEmployees.length > 0 && (
                        <button type="button" onClick={handleClear} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                            <FaTimes size={12} />
                        </button>
                    )}
                    <FaChevronDown className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} size={12} />
                </div>
            </div>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden flex flex-col"
                        style={{ maxHeight: '320px' }}
                    >
                        {/* Search Input */}
                        <div className="p-3 border-b border-gray-50 flex-shrink-0 bg-gray-50/50">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                                <input
                                    type="text"
                                    placeholder="Search employees..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                />
                            </div>
                            {isMulti && selectedEmployees.length > 0 && (
                                <div className="mt-2 text-xs font-semibold text-blue-600 flex justify-between items-center px-1">
                                    <span>{selectedEmployees.length} selected</span>
                                    <button 
                                        type="button" 
                                        onClick={handleClear}
                                        className="hover:underline text-gray-500 hover:text-red-500 font-medium"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Employee List */}
                        <div 
                            ref={listRef}
                            onScroll={handleScroll}
                            className="overflow-y-auto flex-1 p-2 custom-scrollbar relative"
                        >
                            {employees.length === 0 && !loading ? (
                                <div className="py-8 text-center">
                                    <FaUserCircle className="text-gray-200 text-4xl mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">No employees found</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {employees.map(emp => {
                                        const selected = isEmployeeSelected(emp.id);
                                        return (
                                            <div 
                                                key={emp.id}
                                                onClick={() => handleSelect(emp)}
                                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selected ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50 border border-transparent'}`}
                                            >
                                                {/* Checkbox for Multi Mode */}
                                                {isMulti && (
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'}`}>
                                                        {selected && <FaCheck size={10} className="text-white" />}
                                                    </div>
                                                )}

                                                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradient(emp.id)} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                                                    {getInitials(emp.name)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className={`text-sm truncate ${selected ? 'font-bold text-blue-700' : 'font-semibold text-gray-800'}`}>
                                                        {emp.name}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500 font-mono truncate">
                                                        {emp.employee_code} &middot; <span className="uppercase text-[9px] font-sans tracking-wider">{emp.designation?.replace(/_/g, ' ')}</span>
                                                    </p>
                                                </div>
                                                
                                                {/* Single select check indicator */}
                                                {!isMulti && selected && (
                                                    <FaCheck className="text-blue-500 mr-2 shrink-0" size={14} />
                                                )}
                                            </div>
                                        );
                                    })}
                                    {loading && (
                                        <div className="py-4 flex justify-center">
                                            <FaSpinner className="animate-spin text-blue-500" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
