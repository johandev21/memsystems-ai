import { createRouter } from "@tanstack/react-router";
import type { Session, User } from "better-auth";
import { routeTree } from "../routeTree.gen";

export interface AuthContext {
  session: Session | null;
  user: User | null;
  isPending: boolean;
}

export interface RouterContext {
  auth: AuthContext;
}

export const router = createRouter({
  routeTree,
  context: {
    auth: {
      session: null,
      user: null,
      isPending: true,
    },
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

