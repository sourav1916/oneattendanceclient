import React from 'react';
import { FaCoffee, FaBriefcase } from 'react-icons/fa';

export const ATTENDANCE_TYPE_CONFIG = {
    work: {
        value: 'work',
        label: 'Attendance',
        shortLabel: 'Attendance',
        description: 'Punch in and punch out records',
        startLabel: 'Punch In',
        endLabel: 'Punch Out',
        startKey: 'punch_in',
        endKey: 'punch_out',
        icon: FaBriefcase,
        activeClassName: 'bg-blue-600 text-white shadow-sm',
        inactiveClassName: 'text-gray-600 hover:text-blue-700 hover:bg-blue-50',
        accentClassName: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    break: {
        value: 'break',
        label: 'Break',
        shortLabel: 'Break',
        description: 'Break in and break out records',
        startLabel: 'Break In',
        endLabel: 'Break Out',
        startKey: 'break_start',
        endKey: 'break_end',
        icon: FaCoffee,
        activeClassName: 'bg-indigo-600 text-white shadow-sm',
        inactiveClassName: 'text-gray-600 hover:text-indigo-700 hover:bg-indigo-50',
        accentClassName: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    }
};

export const getAttendanceTypeConfig = (type = 'work') => ATTENDANCE_TYPE_CONFIG[type] || ATTENDANCE_TYPE_CONFIG.work;

const AttendanceTypeTabs = ({ value, onChange }) => (
    <div className="flex flex-wrap gap-2 rounded-[14px] border border-gray-200 bg-white shadow-sm mb-2">
        {Object.values(ATTENDANCE_TYPE_CONFIG).map((tab) => {
            const isActive = value === tab.value;
            const Icon = tab.icon;

            return (
                <button
                    key={tab.value}
                    type="button"
                    onClick={() => onChange(tab.value)}
                    className={`inline-flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${isActive ? tab.activeClassName : tab.inactiveClassName
                        }`}
                    title={tab.description}
                >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                </button>
            );
        })}
    </div>
);

export default AttendanceTypeTabs;
