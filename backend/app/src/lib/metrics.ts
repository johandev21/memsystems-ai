import { Elysia } from "elysia";

const DEFAULT_BUCKETS_MS = [
	5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000,
];

function escapeLabelValue(value: string): string {
	return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function encodeLabels(names: string[], values: Record<string, string>): string {
	const parts = names.map((n) => `${n}="${escapeLabelValue(values[n] ?? "")}"`);
	return `{${parts.join(",")}}`;
}

// Matches cuid2 (24-25 lowercase alphanum) or UUID (hex with dashes)
const ID_SEGMENT_RE = /^[0-9a-f]{24,36}$/;
const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function normalizePath(path: string): string {
	return path
		.split("/")
		.map((seg) => {
			if (UUID_RE.test(seg) || ID_SEGMENT_RE.test(seg)) return ":id";
			return seg;
		})
		.join("/");
}

// --- Core metric types (Prometheus-compatible) ---

class Counter {
	private values = new Map<string, number>();

	constructor(
		readonly name: string,
		readonly help: string,
		readonly labelNames: string[],
	) {}

	inc(labels: Record<string, string>, n = 1): void {
		const key = encodeLabels(this.labelNames, labels);
		this.values.set(key, (this.values.get(key) ?? 0) + n);
	}

	collectInto(lines: string[]): void {
		lines.push(`# HELP ${this.name} ${this.help}`);
		lines.push(`# TYPE ${this.name} counter`);
		for (const [key, value] of this.values) {
			lines.push(`${this.name}${key} ${value}`);
		}
	}
}

class Histogram {
	private counts = new Map<string, Map<number, number>>();
	private sums = new Map<string, number>();
	private totals = new Map<string, number>();

	constructor(
		readonly name: string,
		readonly help: string,
		readonly labelNames: string[],
		private readonly buckets: number[] = DEFAULT_BUCKETS_MS,
	) {}

	observe(labels: Record<string, string>, valueMs: number): void {
		const key = encodeLabels(this.labelNames, labels);

		let bucketMap = this.counts.get(key);
		if (!bucketMap) {
			bucketMap = new Map(this.buckets.map((b) => [b, 0]));
			this.counts.set(key, bucketMap);
		}
		for (const le of this.buckets) {
			if (valueMs <= le) {
				bucketMap.set(le, (bucketMap.get(le) ?? 0) + 1);
			}
		}

		this.totals.set(key, (this.totals.get(key) ?? 0) + 1);
		this.sums.set(key, (this.sums.get(key) ?? 0) + valueMs);
	}

	collectInto(lines: string[]): void {
		lines.push(`# HELP ${this.name} ${this.help}`);
		lines.push(`# TYPE ${this.name} histogram`);

		for (const [key, bucketMap] of this.counts) {
			for (const [le, count] of bucketMap) {
				lines.push(`${this.name}_bucket${key} ${count}`);
			}
			lines.push(
				`${this.name}_bucket${key.slice(0, -1)},"+Inf"} ${this.totals.get(key) ?? 0}`,
			);
			lines.push(`${this.name}_sum${key} ${this.sums.get(key) ?? 0}`);
			lines.push(`${this.name}_count${key} ${this.totals.get(key) ?? 0}`);
		}
	}
}

class Gauge {
	private values = new Map<string, number>();

	constructor(
		readonly name: string,
		readonly help: string,
		readonly labelNames: string[],
	) {}

	inc(labels: Record<string, string>, n = 1): void {
		const key = encodeLabels(this.labelNames, labels);
		this.values.set(key, (this.values.get(key) ?? 0) + n);
	}

	dec(labels: Record<string, string>, n = 1): void {
		const key = encodeLabels(this.labelNames, labels);
		this.values.set(key, (this.values.get(key) ?? 0) - n);
	}

	collectInto(lines: string[]): void {
		lines.push(`# HELP ${this.name} ${this.help}`);
		lines.push(`# TYPE ${this.name} gauge`);
		for (const [key, value] of this.values) {
			lines.push(`${this.name}${key} ${value}`);
		}
	}
}

// --- Registry ---

class MetricsRegistry {
	private counters: Counter[] = [];
	private histograms: Histogram[] = [];
	private gauges: Gauge[] = [];

	addCounter(c: Counter): void {
		this.counters.push(c);
	}

	addHistogram(h: Histogram): void {
		this.histograms.push(h);
	}

	addGauge(g: Gauge): void {
		this.gauges.push(g);
	}

	export(): string {
		const lines: string[] = [];
		for (const c of this.counters) c.collectInto(lines);
		for (const h of this.histograms) h.collectInto(lines);
		for (const g of this.gauges) g.collectInto(lines);
		return lines.join("\n") + "\n";
	}
}

// --- Singleton metrics ---

const registry = new MetricsRegistry();

export const httpRequestsTotal = new Counter("http_requests_total", "Total HTTP requests", [
	"method",
	"route",
	"status",
]);
registry.addCounter(httpRequestsTotal);

export const httpRequestDurationMs = new Histogram(
	"http_request_duration_ms",
	"HTTP request duration in milliseconds",
	["method", "route"],
);
registry.addHistogram(httpRequestDurationMs);

export const httpRequestsActive = new Gauge("http_requests_active", "Active HTTP requests", [
	"method",
	"route",
]);
registry.addGauge(httpRequestsActive);

export const errorsTotal = new Counter("errors_total", "Total handled errors", [
	"method",
	"route",
	"error_code",
]);
registry.addCounter(errorsTotal);

export { registry };

// --- Request timing bridge (WeakMap avoids leaking) ---

const startTimes = new WeakMap<Request, { method: string; route: string; time: number }>();

export function finishRequest(request: Request, status: number): void {
	const meta = startTimes.get(request);
	if (!meta) return;
	startTimes.delete(request);

	const durationMs = performance.now() - meta.time;
	const statusStr = String(status);

	httpRequestsActive.dec({ method: meta.method, route: meta.route });
	httpRequestsTotal.inc({ method: meta.method, route: meta.route, status: statusStr });
	httpRequestDurationMs.observe({ method: meta.method, route: meta.route }, durationMs);
}

function pathFrom(url: string): string {
	return normalizePath(new URL(url).pathname);
}

// --- Elysia Plugin ---

export const metricsPlugin = new Elysia({ name: "metrics" })
	.onRequest(({ request }) => {
		const method = request.method;
		const route = pathFrom(request.url);
		startTimes.set(request, { method, route, time: performance.now() });
		httpRequestsActive.inc({ method, route });
	})
	.onAfterHandle(({ request, set }) => {
		finishRequest(request, (set.status as number) ?? 200);
	})
	.get("/metrics", () => {
		return new Response(registry.export(), {
			headers: { "Content-Type": "text/plain; version=0.0.4" },
		});
	});
