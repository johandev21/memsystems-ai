import {
	ArrowUp,
	BookOpen,
	ChevronDown,
	Cpu,
	FileText,
	Globe,
	Infinity as InfinityIcon,
	Layers,
	Map as MapIcon,
	MessageSquare,
	Paperclip,
	Search,
	Sparkles,
	Star,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const CATEGORIES = [
	{
		id: "generate",
		label: "Generate",
		icon: Sparkles,
		prompts: [
			"Create a 10-question multiple choice quiz",
			"Make flashcards for the selected unit",
			"Draft a comprehensive study roadmap",
			"Generate a mind map of the core concepts",
		],
	},
	{
		id: "review",
		label: "Review",
		icon: BookOpen,
		prompts: [
			"Test me on the core concepts",
			"Summarize the last chapter",
			"What are my weakest areas based on past quizzes?",
			"Create a spaced repetition review schedule",
		],
	},
	{
		id: "explain",
		label: "Explain",
		icon: MessageSquare,
		prompts: [
			"Explain this topic like I'm 5 years old",
			"Provide real-world examples of these theories",
			"Break down the complex formulas step-by-step",
			"Compare this concept with previous topics",
		],
	},
	{
		id: "plan",
		label: "Plan",
		icon: MapIcon,
		prompts: [
			"Schedule a study session for tomorrow",
			"How should I prepare for the final exam?",
			"Set study milestones for next week",
			"Analyze and track my learning progress",
		],
	},
];

const MODELS = [
	{
		id: "sonnet-3.5",
		name: "Claude 3.5 Sonnet",
		provider: "Anthropic",
		desc: "Anthropic's most intelligent model",
		cost: "$$$",
		icon: Layers,
		locked: true,
	},
	{
		id: "gpt-4o",
		name: "GPT-4o",
		provider: "OpenAI",
		desc: "OpenAI's frontier model",
		cost: "$$$",
		icon: Cpu,
		locked: true,
	},
	{
		id: "gemini-1.5-pro",
		name: "Gemini 1.5 Pro",
		provider: "Google",
		desc: "Google's best model for long context",
		cost: "$$",
		icon: Sparkles,
		locked: false,
	},
	{
		id: "claude-haiku",
		name: "Claude 3 Haiku",
		provider: "Anthropic",
		desc: "Lightning-fast responses",
		cost: "$",
		icon: Layers,
		locked: false,
	},
];

export function ChatEmptyState() {
	const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
	const [message, setMessage] = useState("");
	const [activeProvider, setActiveProvider] = useState("Favorites");

	return (
		<div className="flex flex-1 h-full w-full flex-col">
			{/* Top Section: Greeting & Prompts (Scrollable) */}
			<div className="flex-1 overflow-y-auto pb-4 pt-12 lg:pt-20">
				<div className="mx-auto flex w-full max-w-3xl flex-col items-center px-6">
					<h1 className="mb-10 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl text-center">
						How can I help you?
					</h1>

					{/* Category Tabs */}
					<div className="mb-8 flex flex-wrap items-center justify-center gap-2">
						{CATEGORIES.map((category) => {
							const isActive = activeCategory.id === category.id;
							const Icon = category.icon;
							return (
								<button
									key={category.id}
									onClick={() => setActiveCategory(category)}
									className={cn(
										"relative flex h-10 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
										isActive
											? "text-background bg-foreground"
											: "text-muted-foreground hover:bg-muted hover:text-foreground",
									)}
								>
									<span className="flex items-center gap-2">
										<Icon className="h-4 w-4" />
										{category.label}
									</span>
								</button>
							);
						})}
					</div>

					{/* Prompts List */}
					<div className="w-full max-w-2xl">
						{activeCategory.prompts.map((prompt, index) => (
							<button
								key={index}
								onClick={() => setMessage(prompt)}
								className="group flex w-full items-center justify-between border-b border-border/50 py-4 text-left text-[15px] text-muted-foreground transition-colors hover:text-foreground last:border-0"
							>
								<span className="truncate pr-4">{prompt}</span>
								<ArrowUp className="h-4 w-4 shrink-0 -translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Bottom Section: Composer */}
			<div className="w-full shrink-0 px-6 pb-6 pt-2">
				<div className="mx-auto w-full max-w-3xl">
					<div className="flex w-full flex-col rounded-3xl border border-border/60 bg-card p-2 shadow-sm transition-all focus-within:border-ring/50 focus-within:shadow-md focus-within:ring-4 focus-within:ring-ring/10">
						{/* File Attachment Chip (Example) */}
						<div className="px-3 pt-2 pb-1">
							<div className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground">
								<FileText className="h-3.5 w-3.5 text-primary" />
								PRD-memsystems.md
							</div>
						</div>

						<textarea
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							placeholder="Type your message here..."
							className="min-h-[60px] w-full resize-none bg-transparent px-4 py-3 text-[15px] outline-none placeholder:text-muted-foreground/70"
							rows={1}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									// Handle submit
								}
							}}
						/>

						<div className="flex items-center justify-between px-2 pb-1 pt-2">
							{/* Model Selector */}
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										className="h-8 gap-1.5 rounded-full px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
									>
										<Sparkles className="h-3.5 w-3.5" />
										Gemini 1.5 Pro
										<span className="text-emerald-600 dark:text-emerald-400">
											$$
										</span>
										<ChevronDown className="h-3.5 w-3.5 opacity-50" />
									</Button>
								</PopoverTrigger>
								<PopoverContent
									align="start"
									sideOffset={8}
									className="w-[380px] p-0 rounded-2xl overflow-hidden border-border/60 shadow-xl"
								>
									<div className="flex flex-col">
										{/* Header */}
										<div className="flex items-center justify-between bg-muted/30 px-4 py-3 border-b border-border/50">
											<div>
												<h3 className="text-sm font-semibold">
													Unlock all models
												</h3>
												<p className="text-xs text-muted-foreground">
													$8/month
												</p>
											</div>
											<Button
												size="sm"
												className="h-7 rounded-full text-xs px-4 bg-primary text-primary-foreground hover:bg-primary/90"
											>
												Upgrade
											</Button>
										</div>

										{/* Search */}
										<div className="p-2 border-b border-border/50">
											<div className="relative">
												<Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
												<Input
													placeholder="Search models..."
													className="h-8 w-full bg-transparent border-0 pl-9 focus-visible:ring-0 shadow-none"
												/>
											</div>
										</div>

										{/* Body with Sidebar */}
										<div className="flex h-[280px]">
											{/* Sidebar Providers */}
											<div className="flex w-12 flex-col items-center gap-2 border-r border-border/50 bg-muted/10 py-2">
												{[
													{ id: "Favorites", icon: Star },
													{ id: "Anthropic", icon: Layers },
													{ id: "OpenAI", icon: Cpu },
													{ id: "Google", icon: Sparkles },
													{ id: "Meta", icon: InfinityIcon },
												].map((provider) => (
													<button
														key={provider.id}
														onClick={() => setActiveProvider(provider.id)}
														className={cn(
															"flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
															activeProvider === provider.id
																? "bg-foreground text-background dark:bg-zinc-800 dark:text-foreground"
																: "text-muted-foreground hover:bg-muted",
														)}
													>
														<provider.icon className="h-4 w-4" />
													</button>
												))}
											</div>

											{/* Model List */}
											<ScrollArea className="flex-1">
												<div className="flex flex-col p-2">
													{MODELS.map((model) => (
														<button
															key={model.id}
															className="group flex flex-col items-start gap-1 rounded-xl p-3 text-left transition-colors hover:bg-muted/50 outline-none focus-visible:ring-2 focus-visible:ring-ring"
														>
															<div className="flex w-full items-center justify-between">
																<span className="flex items-center gap-2 text-sm font-medium text-foreground">
																	{model.name}
																	<span className="text-xs text-emerald-600 dark:text-emerald-400">
																		{model.cost}
																	</span>
																	{model.id === "sonnet-3.5" && (
																		<Star className="h-3 w-3 fill-amber-400 text-amber-400" />
																	)}
																</span>
																<div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground">
																	<model.icon className="h-3.5 w-3.5" />
																</div>
															</div>
															<div className="flex items-center gap-2">
																{model.locked ? (
																	<span className="rounded-md bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive dark:bg-destructive/20 dark:text-red-400">
																		Subscription Required
																	</span>
																) : null}
																<span className="text-xs text-muted-foreground line-clamp-1">
																	{model.desc}
																</span>
															</div>
														</button>
													))}
												</div>
											</ScrollArea>
										</div>
									</div>
								</PopoverContent>
							</Popover>

							{/* Right Tools & Submit */}
							<div className="flex items-center gap-2">
								<div className="flex items-center gap-1 mr-2">
									<TooltipButton icon={Zap} label="Instant Search" />
									<TooltipButton icon={Globe} label="Web Search" />
									<TooltipButton icon={Paperclip} label="Attach Files" />
								</div>
								<Button
									size="icon"
									className={cn(
										"h-9 w-9 shrink-0 rounded-full transition-all duration-300",
										message.trim().length > 0
											? "bg-primary text-primary-foreground shadow-md hover:scale-105"
											: "bg-muted text-muted-foreground hover:bg-muted/80",
									)}
								>
									<ArrowUp className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>

					{/* Footer Text */}
					<div className="mt-4 text-center">
						<p className="text-xs text-muted-foreground/70">
							Make sure you agree to our{" "}
							<a href="#" className="underline hover:text-muted-foreground">
								Terms
							</a>{" "}
							and our{" "}
							<a href="#" className="underline hover:text-muted-foreground">
								Privacy Policy
							</a>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

function TooltipButton({
	icon: Icon,
	label,
}: {
	icon: React.ElementType;
	label: string;
}) {
	return (
		<Button
			variant="ghost"
			size="icon"
			className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
			title={label}
		>
			<Icon className="h-4 w-4" />
			<span className="sr-only">{label}</span>
		</Button>
	);
}
