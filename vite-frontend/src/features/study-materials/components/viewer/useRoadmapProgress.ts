import { useState } from "react";

export interface RoadmapTopic {
  id: string;
  title: string;
  description?: string;
}

export interface RoadmapPhase {
  id: string;
  title: string;
  description?: string;
  topics: RoadmapTopic[];
}

export function useRoadmapProgress(materialId: string, phases: RoadmapPhase[]) {
  const [completedTopics, setCompletedTopics] = useState<
    Record<string, boolean>
  >(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`roadmap-progress-${materialId}`);
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    }
    return {};
  });

  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      if (phases.length > 0 && phases[0]) {
        initial[phases[0].id] = true;
      }
      return initial;
    },
  );

  const toggleTopic = (topicId: string) => {
    const next = { ...completedTopics, [topicId]: !completedTopics[topicId] };
    setCompletedTopics(next);
    try {
      localStorage.setItem(
        `roadmap-progress-${materialId}`,
        JSON.stringify(next),
      );
    } catch {}
  };

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
  };

  const resetProgress = () => {
    setCompletedTopics({});
    try {
      localStorage.removeItem(`roadmap-progress-${materialId}`);
    } catch {}
  };

  const allTopics = phases.flatMap((p) => p.topics);
  const totalTopicsCount = allTopics.length;
  const completedCount = allTopics.filter((t) => completedTopics[t.id]).length;
  const progressPercent =
    totalTopicsCount > 0
      ? Math.round((completedCount / totalTopicsCount) * 100)
      : 0;

  return {
    completedTopics,
    expandedPhases,
    toggleTopic,
    togglePhase,
    resetProgress,
    totalTopicsCount,
    completedCount,
    progressPercent,
  };
}
