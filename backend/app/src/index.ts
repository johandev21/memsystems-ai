import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { betterAuth } from "./auth-plugin";
import { aiController } from "./features/ai/ai.controller";
import { notebookController } from "./features/notebooks/notebook.controller";

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
	.listen(4000);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
