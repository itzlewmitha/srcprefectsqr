import { format, isWithinInterval, setHours, setMinutes } from 'date-fns';

export type AttendanceCategory = 'Morning' | 'Interval' | 'End' | 'Special';

export const getAttendanceCategory = (date: Date): AttendanceCategory => {
  const now = date;
  
  // Morning: 07:00 - 10:30
  if (isWithinInterval(now, {
    start: setMinutes(setHours(now, 7), 0),
    end: setMinutes(setHours(now, 10), 30)
  })) return 'Morning';

  // Interval: 10:30 - 13:00
  if (isWithinInterval(now, {
    start: setMinutes(setHours(now, 10), 31),
    end: setMinutes(setHours(now, 13), 0)
  })) return 'Interval';

  // End: After 13:25
  if (now >= setMinutes(setHours(now, 13), 25)) return 'End';

  return 'Special'; // Default or outside defined ranges
};

export const getCategoryColor = (category: AttendanceCategory) => {
  switch (category) {
    case 'Morning': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'Interval': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'End': return 'bg-sky-100 text-sky-700 border-sky-200';
    case 'Special': return 'bg-purple-100 text-purple-700 border-purple-200';
  }
};
