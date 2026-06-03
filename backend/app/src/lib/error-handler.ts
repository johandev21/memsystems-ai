import { Elysia } from "elysia";
import { DomainError } from "../errors";
import { logger } from "./logger";

export const errorHandlerPlugin = new Elysia({
	name: "error-handler",
}).onError(({ error, set, request }) => {
	if (error instanceof DomainError) {
		logger.warn(error.message, {
			error,
			status: error.status,
			code: error.code,
			internalMessage: error.internalMessage,
		});
		set.status = error.status;
		return { error: error.message, code: error.code };
	}

	logger.error("Unhandled internal error", {
		error,
		method: request.method,
		url: request.url,
	});
	set.status = 500;
	return { error: "Internal server error", code: "internal_error" };
});
