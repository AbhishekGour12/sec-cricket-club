/** Shared event date/time formatters for Home + Events screens. */

export const formatEventDate = (value?: string | null) => {
  if (!value) return '';
  try {
    const d = new Date(`${value}T00:00:00`);
    if (Number.isNaN(d.getTime())) return value;
    // EventCard expects "DD Mon YYYY" (day first).
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return value;
  }
};

export const formatEventTime = (value?: string | null) => {
  if (!value) return '';
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value;
  let hour = Number(match[1]);
  const minute = match[2];
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${period}`;
};

export const toDateKey = (value?: string | null) => {
  if (!value) return '';
  return value.slice(0, 10);
};

export const monthLabel = (year: number, monthIndex: number) => {
  const d = new Date(year, monthIndex, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};
