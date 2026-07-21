// Client-facing barrel — keep server-only exports out to avoid bundling pg on the client
export { DesktopLayout } from "./components/desktop/desktop-layout";
export { ImageUploadDialog } from "./components/dialogs/image-upload-dialog";
export { NotebookSettingsDialog } from "./components/dialogs/notebook-settings-dialog";
export { MobileNotebookLayout } from "./components/mobile/mobile-notebook-layout";
export {
  DialogModelSelector,
  ModelSelector,
} from "./components/shared/model-selector";
export { NotebookBanner } from "./components/shared/notebook-banner";
export { NotebookCardPreview } from "./components/shared/notebook-card-preview";
export { StudioResources } from "./components/shared/studio-resources";
export { NotebookWorkspaceContainer } from "./containers/notebook-workspace-container";
export { useModelPersistence } from "./hooks/use-model-persistence";
export { useNotebookPanels } from "./hooks/use-notebook-panels";
export { useStudioDialogs } from "./hooks/use-studio-dialogs";
export { useTextareaAutosize } from "./hooks/use-textarea-autosize";
