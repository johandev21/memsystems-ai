export interface CellData {
  rowIndex: number;
  dayOfMonth: number;
  level: number;
}

export interface WeekColumn {
  id: string;
  cells: CellData[];
}

export interface MonthGroup {
  year: number;
  month: number;
  label: string;
  weeks: WeekColumn[];
}

export function getMonthNames(locale: string): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { month: "short" });
  return Array.from({ length: 12 }, (_, i) =>
    formatter.format(new Date(2024, i, 1)),
  );
}

export function getDayLabels(locale: string): { id: string; label: string }[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(2024, 0, i + 1);
    const label = formatter.format(date);
    return {
      id: date
        .toLocaleDateString("en", { weekday: "short" })
        .toLowerCase()
        .slice(0, 3),
      label,
    };
  });
}

export function toMondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function computeLevel(day: number, month: number, year: number): number {
  const hash = day * 31 + month * 17 + year;
  const pseudoRandom = (hash * 9301 + 49297) % 233280;
  const normalized = pseudoRandom / 233280;

  if (normalized > 0.7) {
    return Math.min(Math.floor(normalized * 4) + 1, 4);
  }
  if (normalized > 0.45) return 1;
  return 0;
}

export function generateMonthCalendar(
  year: number,
  month: number,
): WeekColumn[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: WeekColumn[] = [];
  let cells: CellData[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const rowIndex = toMondayIndex(date);

    if (rowIndex === 0 && cells.length > 0) {
      weeks.push({ id: `${year}-${month}-${weeks.length}`, cells: [...cells] });
      cells = [];
    }

    cells.push({
      rowIndex,
      dayOfMonth: day,
      level: computeLevel(day, month, year),
    });
  }

  if (cells.length > 0) {
    weeks.push({ id: `${year}-${month}-${weeks.length}`, cells: [...cells] });
  }

  return weeks;
}

export function generateCalendar(
  startYear: number,
  startMonth: number,
  monthNames: string[],
): MonthGroup[] {
  const groups: MonthGroup[] = [];
  const VISIBLE_MONTHS = 12;

  let y = startYear;
  let m = startMonth;

  for (let i = 0; i < VISIBLE_MONTHS; i++) {
    const j = m;
    const jy = y;
    groups.push({
      year: jy,
      month: j,
      label: `${monthNames[j]} '${String(jy).slice(2)}`,
      weeks: generateMonthCalendar(jy, j),
    });
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }

  return groups;
}
