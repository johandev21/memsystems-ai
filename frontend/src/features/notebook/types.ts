export type FileType =
	| "source"
	| "flashcards"
	| "quiz"
	| "roadmap"
	| "audio-overview"
	| "report"
	| "infographic"
	| "mind-map"
	| "slide-deck";

export type SourceStatus = "pending" | "processing" | "ready" | "error";

export interface FileNode {
	id: string;
	name: string;
	fileType?: FileType;
	status?: SourceStatus;
	modified: string;
	size: string;
	isFolder: boolean;
	children?: FileNode[];
	parentId?: string | null;
}

/** Internal tree representation with computed depth. */
export interface TreeNode extends FileNode {
	depth: number;
	children?: TreeNode[];
}

export interface NotebookData {
	id: string;
	title: string;
	description: string;
	imageUrl?: string;
	icon: React.ReactNode;
	items: number;
	modified: string;
	size: string;
	files: FileNode[];
}
