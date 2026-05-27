import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { getSessionFn } from "#/lib/session";

export const Route = createFileRoute("/")({
	beforeLoad: async () => {
		const session = await getSessionFn();

		if (session) {
			throw redirect({ to: "/home" });
		}
	},
	component: LandingPage,
});

function LandingPage() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
			<div className="max-w-md text-center">
				<h1 className="mb-4 font-heading text-5xl font-bold tracking-tight">
					memsystems
				</h1>
				<p className="mb-8 text-lg text-muted-foreground">
					AI-powered study notebooks that help you learn faster with spaced
					repetition and intelligent assistance.
				</p>
				<Button asChild size="lg">
					<Link to="/login">Get Started</Link>
				</Button>
			</div>
		</div>
	);
}
