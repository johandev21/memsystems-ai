export class DomainError extends Error {
	constructor(
		message: string,
		public readonly status: number,
		public readonly code: string,
	) {
		super(message);
		this.name = "DomainError";
	}
}

export class NotFoundError extends DomainError {
	constructor(resource = "Resource") {
		super(`${resource} not found`, 404, "not_found");
		this.name = "NotFoundError";
	}
}

export class ForbiddenError extends DomainError {
	constructor(message = "Forbidden") {
		super(message, 403, "forbidden");
		this.name = "ForbiddenError";
	}
}

export class BadRequestError extends DomainError {
	constructor(message = "Bad request") {
		super(message, 400, "bad_request");
		this.name = "BadRequestError";
	}
}
