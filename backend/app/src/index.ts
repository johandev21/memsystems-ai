import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { betterAuth } from "./auth-plugin";
import { aiController, providerKeyController } from "./features/ai";
import { devStorageController } from "./features/dev-storage/dev-storage.controller";
import { generationModule } from "./features/generation";
import { notebookChatController } from "./features/notebook-chat/notebook-chat.controller";
import { notebookController } from "./features/notebooks/notebook.controller";
import { sourceController } from "./features/sources/source.controller";
import { studyMaterialsModule } from "./features/study-materials";
import { startHardPurgeJob } from "./jobs/hard-purge-trash";
import { requestContextPlugin } from "./lib/request-context";
import { errorHandlerPlugin } from "./lib/error-handler";
import { metricsPlugin } from "./lib/metrics";
import { logger } from "./lib/logger";

const isDev = process.env.NODE_ENV !== "production";

const app = new Elysia()
	.use(
		cors({
			origin: "http://localhost:3000",
			methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
			credentials: true,
			allowedHeaders: ["Content-Type", "Authorization"],
		}),
	)
	.use(betterAuth)
	.use(requestContextPlugin)
	.use(metricsPlugin)
	.use(errorHandlerPlugin)
	.use(aiController)
	.use(providerKeyController)
	.use(notebookController)
	.use(sourceController)
	.use(studyMaterialsModule)
	.use(generationModule)
	.use(notebookChatController);
if (isDev) app.use(devStorageController);
app.listen(4000);

startHardPurgeJob();

logger.info("Elysia server started", {
	hostname: app.server?.hostname,
	port: app.server?.port,
});
