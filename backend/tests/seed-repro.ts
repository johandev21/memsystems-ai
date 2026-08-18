import { createId } from '@paralleldrive/cuid2';
import { createDatabaseConnection } from '../src/database/connection';
import { user, session } from '../src/database/auth-schema';
import {
  notebooks,
  sources,
  studyMaterials,
} from '../src/database/schema';

const { db } = createDatabaseConnection(
  'postgresql://postgres:superuser@localhost:5432/memsystems_db',
);

async function main() {
  const email = 'repo-test@example.com';
  const userId = createId();
  await db.insert(user).values({ id: userId, name: 'Repo Test', email, emailVerified: false });

  const token = createId().repeat(2);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  await db.insert(session).values({
    id: createId(),
    token,
    expiresAt,
    userId,
    userAgent: 'opencode-repro',
  });

  const nbRows = await db
    .insert(notebooks)
    .values({ userId, title: 'Repro Notebook', description: 'seed' })
    .returning({ id: notebooks.id });
  const notebookId = nbRows[0].id;

  await db.insert(sources).values({
    notebookId,
    kind: 'text',
    title: 'Sample Source',
    rawText: 'Some raw text content for the source.',
  });

  await db.insert(studyMaterials).values({
    notebookId,
    kind: 'quiz',
    title: 'Sample Quiz',
    content: {
      title: 'Sample Quiz',
      questions: [
        {
          id: 'q1',
          prompt: 'What is 2 + 2?',
          options: [
            { id: 'a', text: '4', explanation: 'Basic math' },
            { id: 'b', text: '5', explanation: 'Wrong' },
          ],
          correctOptionId: 'a',
          hint: '',
          topic: '',
        },
      ],
    },
  });

  console.log(JSON.stringify({ token, notebookId, userId, email }));
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });