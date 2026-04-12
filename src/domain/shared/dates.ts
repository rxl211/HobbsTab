export const toMonthKey = (isoDate: string) => isoDate.slice(0, 7);

export const startOfMonth = (isoDate: string) => `${toMonthKey(isoDate)}-01`;

export const monthLabel = (monthKey: string) =>
  new Date(`${monthKey}-01T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

export const formatDate = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export const currentMonthKey = () => toMonthKey(new Date().toISOString().slice(0, 10));

export const monthKeysBetween = (startMonth: string, endMonth: string) => {
  const months: string[] = [];
  const cursor = new Date(`${startMonth}-01T00:00:00`);
  const end = new Date(`${endMonth}-01T00:00:00`);

  while (cursor <= end) {
    months.push(cursor.toISOString().slice(0, 7));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
};
