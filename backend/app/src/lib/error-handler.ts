import { Elysia } from "elysia";
import { DomainError } from "../errors";
import { logger } from "./logger";
import { errorsTotal, finishRequest, normalizePath } from "./metrics";

export const errorHandlerPlugin = new Elysia({
	name: "error-handler",
}).onError(({ error, set, request }) => {
	const method = request.method;
	const route = normalizePath(new URL(request.url).pathname);

	if (error instanceof DomainError) {
		logger.warn(error.message, {
			error,
			status: error.status,
			code: error.code,
			internalMessage: error.internalMessage,
		});
		errorsTotal.inc({ method, route, error_code: error.code });
		finishRequest(request, error.status);
		set.status = error.status;
		return { error: error.message, code: error.code };
	}

	logger.error("Unhandled internal error", {
		error,
		method,
		url: request.url,
	});
	errorsTotal.inc({ method, route, error_code: "internal_error" });
	finishRequest(request, 500);
	set.status = 500;
	return { error: "Internal server error", code: "internal_error" };
});
