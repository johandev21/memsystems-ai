import { createQueryOptions } from "./factory";

export interface ModelOption {
  id: string;
  displayName: string;
}

export const modelsQueryOptions = createQueryOptions<ModelOption[]>(
  ["models"],
  "/api/ai/models",
);
