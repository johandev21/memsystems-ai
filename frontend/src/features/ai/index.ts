// Client-facing barrel — keep server-only exports out to avoid bundling pg on the client
export { useConnectionStatus } from "./hooks/use-connection-status";
