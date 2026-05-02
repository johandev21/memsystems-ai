import { useEffect, useRef, useState } from "react";
import { Input } from "#/components/ui/input";
import { cn } from "#/lib/utils";

interface InlineRenameProps {
	name: string;
	onConfirm: (newName: string) => void;
	onCancel: () => void;
	className?: string;
}

export function InlineRename({
	name,
	onConfirm,
	onCancel,
	className,
}: InlineRenameProps) {
	const [value, setValue] = useState(name);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
		inputRef.current?.select();
	}, []);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			if (value.trim() && value.trim().length <= 100) {
				onConfirm(value.trim());
			}
		} else if (e.key === "Escape") {
			onCancel();
		}
	};

	const handleBlur = () => {
		if (value.trim() && value.trim().length <= 100) {
			onConfirm(value.trim());
		} else {
			onCancel();
		}
	};

	return (
		<Input
			ref={inputRef}
			value={value}
			onChange={(e) => setValue(e.target.value)}
			onKeyDown={handleKeyDown}
			onBlur={handleBlur}
			onClick={(e) => e.stopPropagation()}
			className={cn("h-7 w-64 text-sm", className)}
			maxLength={100}
		/>
	);
}
