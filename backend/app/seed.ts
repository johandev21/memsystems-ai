import { eq } from "drizzle-orm";
import { db } from "./src/database/connection";
import { notebooks } from "./src/database/schema";
import { user } from "./auth-schema";

const USERS = [
	{
		id: "C92FAcQDqJe7ptYyGxVLL67lafIOgviI",
		name: "Alice",
		email: "alice@example.com",
	},
	{
		id: "qGTsEsKVaFGiGPduWRjin81dk3IIYa2w",
		name: "Bob",
		email: "bob@example.com",
	},
	{
		id: "iVmhJT4EU5fFmFA5xwq7XbZlMNlWSAj6",
		name: "Charlie",
		email: "charlie@example.com",
	},
];

const TOPICS = [
	{
		title: "World History",
		description:
			"From ancient civilizations to the modern era — key events, figures, and turning points that shaped humanity.",
		icon: "globe",
	},
	{
		title: "Introduction to Philosophy",
		description:
			"Foundational questions about existence, knowledge, ethics, and reason through the lens of major philosophers.",
		icon: "brain",
	},
	{
		title: "Computer Science",
		description:
			"Algorithms, data structures, computation theory, and the principles that power modern computing.",
		icon: "monitor",
	},
	{
		title: "Software Engineering",
		description:
			"Design patterns, system architecture, testing, and best practices for building maintainable software.",
		icon: "code",
	},
	{
		title: "Biology",
		description:
			"Cell biology, genetics, evolution, and the mechanisms of life from molecules to ecosystems.",
		icon: "dna",
	},
];

async function seed() {
	for (const u of USERS) {
		await db
			.insert(user)
			.values({
				id: u.id,
				name: u.name,
				email: u.email,
			})
			.onConflictDoNothing({ target: user.id });

		await db.delete(notebooks).where(eq(notebooks.userId, u.id));
	}

	const values: (typeof notebooks.$inferInsert)[] = [];

	for (const u of USERS) {
		for (const topic of TOPICS) {
			values.push({
				userId: u.id,
				title: topic.title,
				description: topic.description,
				icon: topic.icon,
			});
		}
	}

	const result = await db.insert(notebooks).values(values).returning({
		id: notebooks.id,
		userId: notebooks.userId,
		title: notebooks.title,
	});

	console.log(`Inserted ${result.length} notebooks across ${USERS.length} users:`);
	for (const nb of result) {
		console.log(`  ${nb.id} — ${nb.title} (${nb.userId})`);
	}

	process.exit(0);
}

seed().catch((err) => {
	console.error("Seed failed:", err);
	process.exit(1);
});
