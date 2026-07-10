"use client";

import {
  DirectionProvider as BaseDirectionProvider,
  type DirectionProviderProps,
  useDirection,
} from "@base-ui/react/direction-provider";
import type * as React from "react";

function DirectionProvider({
  dir,
  direction,
  children,
}: DirectionProviderProps & {
  dir?: DirectionProviderProps["direction"];
  direction?: DirectionProviderProps["direction"];
}) {
  return (
    <BaseDirectionProvider direction={direction ?? dir}>
      {children}
    </BaseDirectionProvider>
  );
}

export { DirectionProvider, useDirection };
