import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Link,
	Scripts,
	useRouter,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { AlertOctagon, RotateCcw, Home } from "lucide-react";

import { getThemeScript, ThemeProvider } from "#/components/theme-provider";
import { NotFound } from "#/components/not-found";
import appCss from "../styles.css?url";

export interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "TanStack Start Starter",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	notFoundComponent: () => <NotFound />,
	errorComponent: RootErrorComponent,
	shellComponent: RootDocument,
});

function RootErrorComponent({
	error,
	reset,
}: {
	error: Error;
	reset: () => void;
}) {
	const router = useRouter();

	return (
		<div className="min-h-screen w-full flex items-center justify-center p-6 bg-background text-foreground font-mono">
			<div className="max-w-md w-full border border-border bg-panel-bg p-8 shadow-sm flex flex-col items-center text-center">
				<div className="flex h-12 w-12 items-center justify-center border border-destructive bg-destructive/10 text-destructive mb-6">
					<AlertOctagon className="h-6 w-6" />
				</div>
				<h1 className="text-base font-bold uppercase tracking-tight mb-2">
					Something went wrong
				</h1>
				<p className="text-xs text-muted-foreground leading-relaxed mb-6 max-w-xs break-words">
					{error.message || "An unexpected error occurred in the application."}
				</p>
				<div className="flex items-center justify-center gap-3 w-full">
					<button
						type="button"
						onClick={() => {
							reset();
							router.invalidate();
						}}
						className="flex items-center gap-2 px-4 py-2 border border-border bg-muted/20 hover:bg-muted/50 text-xs font-mono font-semibold cursor-pointer transition-colors"
					>
						<RotateCcw className="h-3 w-3" />
						Retry
					</button>
					<Link
						to="/home"
						className="flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:opacity-90 text-xs font-mono font-semibold transition-opacity"
					>
						<Home className="h-3 w-3" />
						Go Home
					</Link>
				</div>
			</div>
		</div>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
				<script
					dangerouslySetInnerHTML={{
						__html: getThemeScript(),
					}}
				/>
			</head>
			<body>
				<ThemeProvider>{children}</ThemeProvider>
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
