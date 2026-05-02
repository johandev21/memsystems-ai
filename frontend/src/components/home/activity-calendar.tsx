import { ChevronLeft, ChevronRight, Circle } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "#/components/ui/button";

const MONTH_NAMES = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

const DAY_LABELS = [
	{ id: "mon", label: "M" },
	{ id: "tue", label: "T" },
	{ id: "wed", label: "W" },
	{ id: "thu", label: "T" },
	{ id: "fri", label: "F" },
	{ id: "sat", label: "S" },
	{ id: "sun", label: "S" },
];

const VISIBLE_MONTHS = 12;

interface CellData {
	rowIndex: number;
	dayOfMonth: number;
	level: number;
}

interface WeekColumn {
	id: string;
	cells: CellData[];
}

interface MonthGroup {
	year: number;
	month: number;
	label: string;
	weeks: WeekColumn[];
}

function toMondayIndex(date: Date): number {
	return (date.getDay() + 6) % 7;
}

function computeLevel(day: number, month: number, year: number): number {
	const hash = day * 31 + month * 17 + year;
	const pseudoRandom = (hash * 9301 + 49297) % 233280;
	const normalized = pseudoRandom / 233280;

	if (normalized > 0.7) {
		return Math.min(Math.floor(normalized * 4) + 1, 4);
	}
	if (normalized > 0.45) return 1;
	return 0;
}

function generateMonthCalendar(year: number, month: number): WeekColumn[] {
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

function generateCalendar(startYear: number, startMonth: number): MonthGroup[] {
	const groups: MonthGroup[] = [];

	let y = startYear;
	let m = startMonth;

	for (let i = 0; i < VISIBLE_MONTHS; i++) {
		const j = m;
		const jy = y;
		groups.push({
			year: jy,
			month: j,
			label: `${MONTH_NAMES[j]} '${String(jy).slice(2)}`,
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

function getCellColor(level: number): string {
	switch (level) {
		case 0:
			return "bg-heatmap-empty";
		case 1:
			return "bg-heatmap-level-1";
		case 2:
			return "bg-heatmap-level-2";
		case 3:
			return "bg-heatmap-level-3";
		case 4:
			return "bg-heatmap-level-4";
		default:
			return "bg-heatmap-empty";
	}
}

interface ActivityCalendarProps {
	className?: string;
}

export function ActivityCalendar({ className }: ActivityCalendarProps) {
	const now = useMemo(() => new Date(), []);
	const [offsetMonth, setOffsetMonth] = useState(0);
	const scrollRef = useRef<HTMLDivElement>(null);

	const startYear =
		now.getFullYear() + Math.floor((now.getMonth() + offsetMonth) / 12);
	const startMonth = (((now.getMonth() + offsetMonth) % 12) + 12) % 12;

	const groups = useMemo(
		() => generateCalendar(startYear, startMonth),
		[startYear, startMonth],
	);

	const shift = useCallback((delta: number) => {
		setOffsetMonth((prev) => prev + delta);
		requestAnimationFrame(() => {
			scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
		});
	}, []);

	const reset = useCallback(() => {
		setOffsetMonth(0);
		requestAnimationFrame(() => {
			scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
		});
	}, []);

	const cellSizeRem = 0.75;
	const gapRem = 0.25;
	const monthGapRem = 1;
	const labelHeightRem = 1;
	const dayLabelGapRem = 1.5;

	const totalGridHeightRem =
		7 * cellSizeRem + 6 * gapRem + gapRem + labelHeightRem;

	return (
		<div
			className={`flex flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10 ${className}`}
		>
			<div ref={scrollRef} className="scrollbar-none overflow-x-auto">
				<div
					className="flex"
					style={{
						minWidth: "fit-content",
						height: `${totalGridHeightRem}rem`,
					}}
				>
					{/* Day labels */}
					<div
						className="flex shrink-0 flex-col justify-center"
						style={{
							paddingRight: `${dayLabelGapRem}rem`,
							gap: `${gapRem}rem`,
						}}
					>
						{DAY_LABELS.map((entry) => (
							<span
								key={entry.id}
								className="flex items-center justify-end text-[8px] text-muted-foreground"
								style={{
									height: `${cellSizeRem}rem`,
									width: `${cellSizeRem}rem`,
								}}
							>
								{entry.label}
							</span>
						))}
					</div>

					{/* Month groups */}
					{groups.map((group, gi) => (
						<div
							key={`${group.year}-${group.month}`}
							className="flex shrink-0 flex-col items-center"
							style={{ marginLeft: gi > 0 ? `${monthGapRem}rem` : 0 }}
						>
							{/* Week columns */}
							<div className="flex" style={{ gap: `${gapRem}rem` }}>
								{group.weeks.map((week) => (
									<div
										key={week.id}
										className="relative"
										style={{
											width: `${cellSizeRem}rem`,
											height: `${7 * cellSizeRem + 6 * gapRem}rem`,
										}}
									>
										{week.cells.map((cell) => (
											<div
												key={cell.dayOfMonth}
												className={`absolute size-3 ${getCellColor(cell.level)}`}
												style={{
													top: `${cell.rowIndex * (cellSizeRem + gapRem)}rem`,
												}}
											/>
										))}
									</div>
								))}
							</div>

							{/* Month label */}
							<span
								className="whitespace-nowrap text-[10px] text-muted-foreground"
								style={{
									marginTop: `${gapRem}rem`,
									height: `${labelHeightRem}rem`,
									lineHeight: `${labelHeightRem}rem`,
								}}
							>
								{group.label}
							</span>
						</div>
					))}
				</div>
			</div>

			{/* Navigation */}
			<div className="flex items-center justify-center gap-1">
				<Button
					variant="ghost"
					size="icon-xs"
					className="text-muted-foreground"
					onClick={() => shift(-1)}
				>
					<ChevronLeft className="size-3.5" />
				</Button>
				<Button
					variant="ghost"
					size="icon-xs"
					className="text-muted-foreground"
					onClick={reset}
				>
					<Circle className="size-3.5" />
				</Button>
				<Button
					variant="ghost"
					size="icon-xs"
					className="text-muted-foreground"
					onClick={() => shift(1)}
				>
					<ChevronRight className="size-3.5" />
				</Button>
			</div>
		</div>
	);
}
