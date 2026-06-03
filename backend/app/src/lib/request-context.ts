import { Elysia } from "elysia";
import { createId } from "@paralleldrive/cuid2";
import { correlationStorage } from "./correlation-storage";

export const requestContextPlugin = new Elysia({
	name: "request-context",
}).onRequest(({ request }) => {
	const correlationId =
		request.headers.get("x-correlation-id") ?? createId();
	correlationStorage.enterWith({ correlationId });
});
