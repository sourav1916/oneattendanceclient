const TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

export const formatMinutes = (minutes) => {
  const safeMinutes = Number.isFinite(Number(minutes)) ? Math.max(0, Math.round(Number(minutes))) : 0;
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;

  if (hours && mins) return `${hours}h ${mins}m`;
  if (hours) return `${hours}h`;
  return `${mins}m`;
};

export const formatClockTime = (value) => {
  if (!value) return '';

  const normalized = String(value).trim();
  const parts = normalized.split(':');
  if (parts.length < 2) return normalized;

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  const seconds = Number(parts[2] || 0);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || !Number.isFinite(seconds)) return normalized;

  const date = new Date();
  date.setHours(hours, minutes, seconds, 0);
  return TIME_FORMATTER.format(date);
};

const parseTimeToMinutes = (value) => {
  if (!value) return null;

  const normalized = String(value).trim();
  const match = normalized.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] || 0);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || !Number.isFinite(seconds)) return null;

  return hours * 60 + minutes + (seconds >= 30 ? 1 : 0);
};

const minutesBetweenTimes = (startTime, endTime) => {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);

  if (start === null || end === null) return null;

  let diff = end - start;
  if (diff < 0) diff += 24 * 60;
  return diff;
};

const normalizeSchedule = (employee = {}) => {
  const shiftStart = employee?.shift_start || employee?.shiftStart || employee?.start_time || null;
  const shiftEnd = employee?.shift_end || employee?.shiftEnd || employee?.end_time || null;
  const breakMinutes = Number(employee?.break_minutes ?? employee?.breakMinutes ?? 0) || 0;
  const graceMinutes = Number(employee?.grace_minutes ?? employee?.graceMinutes ?? 0) || 0;
  const expectedWorkMinutesRaw = Number(employee?.expected_work_minutes ?? employee?.expectedWorkMinutes ?? 0) || 0;
  const shiftSpanMinutes = minutesBetweenTimes(shiftStart, shiftEnd);
  const expectedWorkMinutes = expectedWorkMinutesRaw > 0
    ? expectedWorkMinutesRaw
    : Math.max(0, (shiftSpanMinutes ?? 0) - breakMinutes);

  return {
    shiftStart,
    shiftEnd,
    breakMinutes,
    graceMinutes,
    expectedWorkMinutes,
    shiftSpanMinutes,
  };
};

export const calculateAttendanceTimeDetails = (employee = {}, startTime, endTime, attendanceType = 'attendance') => {
  const schedule = normalizeSchedule(employee);
  const actualMinutes = minutesBetweenTimes(startTime, endTime);
  const type = String(attendanceType || 'attendance').toLowerCase();

  if (actualMinutes === null) {
    return {
      ...schedule,
      actualMinutes: null,
      expectedMinutes: type === 'break' ? Math.max(0, schedule.breakMinutes) : Math.max(0, schedule.expectedWorkMinutes),
      deltaMinutes: null,
      overtimeMinutes: 0,
      deductibleMinutes: 0,
      isOvertime: false,
      isDeductible: false,
      isHalfDay: false,
      showFlags: false,
      lockedFlags: false,
      summary: null,
      summaryTone: 'neutral',
      details: [],
    };
  }

  const expectedMinutes = type === 'break'
    ? Math.max(0, schedule.breakMinutes)
    : Math.max(0, schedule.expectedWorkMinutes);
  const graceMinutes = Math.max(0, schedule.graceMinutes);
  const deltaMinutes = actualMinutes - expectedMinutes;
  const overtimeMinutes = deltaMinutes > graceMinutes ? deltaMinutes : 0;
  const deductibleMinutes = deltaMinutes < -graceMinutes ? Math.abs(deltaMinutes) : 0;
  const isOvertime = overtimeMinutes > 0;
  const isDeductible = deductibleMinutes > 0;
  const isHalfDay = type === 'attendance' && expectedMinutes > 0 && actualMinutes <= Math.floor(expectedMinutes / 2);
  const showFlags = isOvertime || isDeductible || isHalfDay;
  const withinGrace = Math.abs(deltaMinutes) <= graceMinutes;

  let summary = null;
  let summaryTone = 'neutral';

  if (type === 'attendance') {
    if (withinGrace) {
      summary = 'Within scheduled time';
      summaryTone = 'success';
    } else if (isOvertime) {
      summary = `Overtime by ${formatMinutes(overtimeMinutes)}`;
      summaryTone = 'warning';
    } else if (isHalfDay) {
      summary = `Half day detected (${formatMinutes(Math.max(0, expectedMinutes - actualMinutes))} short)`;
      summaryTone = 'danger';
    } else if (isDeductible) {
      summary = `Deductible by ${formatMinutes(deductibleMinutes)}`;
      summaryTone = 'danger';
    }
  } else {
    if (withinGrace) {
      summary = 'Within allowed break time';
      summaryTone = 'success';
    } else if (isDeductible) {
      summary = `Deductible by ${formatMinutes(deductibleMinutes)}`;
      summaryTone = 'danger';
    }
  }

  const details = [
    {
      label: type === 'break' ? 'Allowed break' : 'Expected work',
      value: formatMinutes(expectedMinutes),
    },
    {
      label: 'Actual time',
      value: formatMinutes(actualMinutes),
    },
    {
      label: 'Grace',
      value: formatMinutes(graceMinutes),
    },
    ...(schedule.shiftStart || schedule.shiftEnd ? [{
      label: 'Shift window',
      value: [formatClockTime(schedule.shiftStart), formatClockTime(schedule.shiftEnd)].filter(Boolean).join(' - ') || '---',
    }] : []),
    ...(isOvertime ? [{
      label: 'Overtime',
      value: formatMinutes(overtimeMinutes),
    }] : []),
    ...(isHalfDay ? [{
      label: 'Half day shortfall',
      value: formatMinutes(Math.max(0, expectedMinutes - actualMinutes)),
    }] : []),
    ...(isDeductible ? [{
      label: 'Deductible',
      value: formatMinutes(deductibleMinutes),
    }] : []),
  ];

  return {
    ...schedule,
    actualMinutes,
    expectedMinutes,
    deltaMinutes,
    overtimeMinutes,
    deductibleMinutes,
    isOvertime,
    isDeductible,
    isHalfDay,
    showFlags,
    lockedFlags: showFlags,
    summary,
    summaryTone,
    details,
  };
};
