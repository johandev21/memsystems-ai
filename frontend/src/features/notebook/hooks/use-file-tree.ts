import { useCallback, useMemo, useState } from "react";
import type { FileNode, TreeNode } from "#/features/notebook/types";

interface UseFileTreeOptions {
	files: FileNode[];
	filterQuery?: string;
}

function buildTree(flatFiles: FileNode[]): TreeNode[] {
	const map = new Map<string, TreeNode>();
	const roots: TreeNode[] = [];

	for (const file of flatFiles) {
		map.set(file.id, { ...file, depth: 0, children: [] });
	}

	for (const file of flatFiles) {
		const node = map.get(file.id);
		if (!node) continue;
		if (file.parentId && map.has(file.parentId)) {
			const parent = map.get(file.parentId);
			if (!parent) continue;
			if (!parent.children) parent.children = [];
			parent.children.push(node);
		} else {
			roots.push(node);
		}
	}

	return roots;
}

function injectSourcesFolder(tree: TreeNode[]): TreeNode[] {
	const hasSources = tree.some(
		(node) => node.isFolder && node.name === "Sources",
	);
	if (hasSources) return tree;

	const sourcesFolder: TreeNode = {
		id: "__sources__",
		name: "Sources",
		isFolder: true,
		modified: "—",
		size: "—",
		depth: 0,
		children: [],
	};
	return [sourcesFolder, ...tree];
}

function assignDepth(nodes: TreeNode[], depth = 0): TreeNode[] {
	return nodes.map((node) => ({
		...node,
		depth,
		children: node.children ? assignDepth(node.children, depth + 1) : undefined,
	}));
}

function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
	const lower = query.toLowerCase();
	return nodes
		.map((node) => {
			const filteredChildren = node.children
				? filterTree(node.children, query)
				: [];
			const selfMatch = node.name.toLowerCase().includes(lower);
			if (selfMatch || filteredChildren.length > 0) {
				return {
					...node,
					children:
						filteredChildren.length > 0 ? filteredChildren : node.children,
				};
			}
			return null;
		})
		.filter(Boolean) as TreeNode[];
}

function flattenVisible(
	nodes: TreeNode[],
	expandedIds: Set<string>,
	result: TreeNode[],
) {
	for (const node of nodes) {
		result.push(node);
		if (node.isFolder && expandedIds.has(node.id) && node.children) {
			flattenVisible(node.children, expandedIds, result);
		}
	}
}

function collectFolderIds(nodes: TreeNode[], ids: Set<string>) {
	for (const node of nodes) {
		if (node.isFolder) {
			ids.add(node.id);
			if (node.children) collectFolderIds(node.children, ids);
		}
	}
}

export interface UseFileTreeResult {
	tree: TreeNode[];
	visibleNodes: TreeNode[];
	expandedIds: Set<string>;
	selectedId: string | null;
	focusedId: string | null;
	visibleNodeIds: string[];
	toggleExpand: (id: string) => void;
	expandAll: () => void;
	collapseAll: () => void;
	selectNode: (id: string | null) => void;
	focusNode: (id: string | null) => void;
	focusNext: () => void;
	focusPrevious: () => void;
	focusFirst: () => void;
	focusLast: () => void;
	isExpanded: (id: string) => boolean;
	isSelected: (id: string) => boolean;
	isFocused: (id: string) => boolean;
}

export function useFileTree({
	files,
	filterQuery,
}: UseFileTreeOptions): UseFileTreeResult {
	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [focusedId, setFocusedId] = useState<string | null>(null);

	const tree = useMemo(() => {
		if (files.length === 0) return [];
		const built = buildTree(files);
		const withSources = injectSourcesFolder(built);
		return assignDepth(withSources);
	}, [files]);

	const filteredTree = useMemo(() => {
		if (!filterQuery || filterQuery.trim().length === 0) return tree;
		return filterTree(tree, filterQuery);
	}, [tree, filterQuery]);

	const visibleNodes = useMemo(() => {
		const nodes: TreeNode[] = [];
		flattenVisible(filteredTree, expandedIds, nodes);
		return nodes;
	}, [filteredTree, expandedIds]);

	const visibleNodeIds = useMemo(
		() => visibleNodes.map((n) => n.id),
		[visibleNodes],
	);

	const toggleExpand = useCallback((id: string) => {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}, []);

	const expandAll = useCallback(() => {
		const allIds = new Set<string>();
		collectFolderIds(tree, allIds);
		setExpandedIds(allIds);
	}, [tree]);

	const collapseAll = useCallback(() => {
		setExpandedIds(new Set());
	}, []);

	const selectNode = useCallback((id: string | null) => {
		setSelectedId(id);
	}, []);

	const focusNode = useCallback((id: string | null) => {
		setFocusedId(id);
	}, []);

	const focusNext = useCallback(() => {
		setFocusedId((current) => {
			if (!current) return visibleNodeIds[0] ?? null;
			const idx = visibleNodeIds.indexOf(current);
			return visibleNodeIds[idx + 1] ?? current;
		});
	}, [visibleNodeIds]);

	const focusPrevious = useCallback(() => {
		setFocusedId((current) => {
			if (!current) return visibleNodeIds[visibleNodeIds.length - 1] ?? null;
			const idx = visibleNodeIds.indexOf(current);
			return visibleNodeIds[idx - 1] ?? current;
		});
	}, [visibleNodeIds]);

	const focusFirst = useCallback(() => {
		setFocusedId(visibleNodeIds[0] ?? null);
	}, [visibleNodeIds]);

	const focusLast = useCallback(() => {
		setFocusedId(visibleNodeIds[visibleNodeIds.length - 1] ?? null);
	}, [visibleNodeIds]);

	const isExpanded = useCallback(
		(id: string) => expandedIds.has(id),
		[expandedIds],
	);

	const isSelected = useCallback(
		(id: string) => selectedId === id,
		[selectedId],
	);

	const isFocused = useCallback((id: string) => focusedId === id, [focusedId]);

	return {
		tree,
		visibleNodes,
		expandedIds,
		selectedId,
		focusedId,
		visibleNodeIds,
		toggleExpand,
		expandAll,
		collapseAll,
		selectNode,
		focusNode,
		focusNext,
		focusPrevious,
		focusFirst,
		focusLast,
		isExpanded,
		isSelected,
		isFocused,
	};
}
