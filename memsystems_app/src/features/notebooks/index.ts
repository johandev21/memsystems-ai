// Client-facing barrel — keep server-only exports out to avoid bundling pg on the client
export { DesktopLayout } from "./components/desktop-layout";
export { MobileNotebookLayout } from "./components/mobile-notebook-layout";
export {
  DialogModelSelector,
  ModelSelector,
} from "./components/model-selector";
export { NotebookBanner } from "./components/notebook-banner";
export { NotebookSettingsDialog } from "./components/notebook-settings-dialog";
export { StudioResources } from "./components/studio-resources";
export { useModelPersistence } from "./hooks/use-model-persistence";
export { useTextareaAutosize } from "./hooks/use-textarea-autosize";
