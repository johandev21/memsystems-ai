import {
	CircleHelp,
	FileBarChart,
	FileText,
	Headphones,
	Image,
	Layers,
	Map as MapIcon,
	Network,
	Presentation,
} from "lucide-react";
import type { FileType } from "#/features/notebook/types";

const iconMap: Record<FileType, typeof FileText> = {
	source: FileText,
	flashcards: Layers,
	quiz: CircleHelp,
	roadmap: MapIcon,
	"audio-overview": Headphones,
	report: FileBarChart,
	infographic: Image,
	"mind-map": Network,
	"slide-deck": Presentation,
};

export function getFileTypeIcon(fileType: FileType) {
	return iconMap[fileType] ?? FileText;
}
