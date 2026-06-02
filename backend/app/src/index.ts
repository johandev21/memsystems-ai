import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { betterAuth } from "./auth-plugin";
import { aiController } from "./features/ai/ai.controller";
import { devStorageController } from "./features/dev-storage/dev-storage.controller";
import { notebookController } from "./features/notebooks/notebook.controller";
import { sourceController } from "./features/sources/source.controller";

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
	.use(aiController)
	.use(notebookController)
	.use(sourceController);
if (isDev) app.use(devStorageController);
app.listen(4000);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
