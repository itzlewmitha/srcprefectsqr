import { format, isWithinInterval, setHours, setMinutes } from 'date-fns';

export type AttendanceCategory = 'Morning Progress' | 'Interval Time' | 'End of School' | 'Special Occasion';

export const getAttendanceCategory = (date: Date): AttendanceCategory => {
  const now = date;
  
  // Morning Progress: 07:00 - 10:30
  if (isWithinInterval(now, {
    start: setMinutes(setHours(now, 7), 0),
    end: setMinutes(setHours(now, 10), 30)
  })) return 'Morning Progress';

  // Interval Time: 10:30 - 13:00
  if (isWithinInterval(now, {
    start: setMinutes(setHours(now, 10), 31),
    end: setMinutes(setHours(now, 13), 0)
  })) return 'Interval Time';

  // End of School: After 13:25
  if (now >= setMinutes(setHours(now, 13), 25)) return 'End of School';

  return 'Special Occasion'; // Default or outside defined ranges
};

export const getCategoryColor = (category: AttendanceCategory) => {
  switch (category) {
    case 'Morning Progress': return 'bg-emerald-100 text-emerald-700 border-emerald-900';
    case 'Interval Time': return 'bg-amber-100 text-amber-700 border-amber-900';
    case 'End of School': return 'bg-sky-100 text-sky-700 border-sky-900';
    case 'Special Occasion': return 'bg-purple-100 text-purple-700 border-purple-900';
  }
};
