import { type RefObject, useEffect } from "react";

export interface UseTextareaAutosizeOptions {
	ref: RefObject<HTMLTextAreaElement | null>;
	value: string;
	minHeight?: number;
	maxHeight?: number;
}

export function useTextareaAutosize({
	ref,
	value,
	minHeight = 60,
	maxHeight = 200,
}: UseTextareaAutosizeOptions) {
	// biome-ignore lint/correctness/useExhaustiveDependencies: resize on input value change
	useEffect(() => {
		const textarea = ref.current;
		if (!textarea) return;

		textarea.style.height = "auto";
		const nextHeight = Math.min(
			Math.max(textarea.scrollHeight, minHeight),
			maxHeight,
		);
		textarea.style.height = `${nextHeight}px`;
		textarea.style.overflowY = nextHeight >= maxHeight ? "auto" : "hidden";
	}, [ref, value, minHeight, maxHeight]);
}
