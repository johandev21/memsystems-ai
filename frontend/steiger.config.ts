import { defineConfig } from "steiger";
import fsd from "@feature-sliced/steiger-plugin";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    rules: {
      "fsd/insignificant-slice": "off",
      "fsd/no-segmentless-slices": "off",
      "fsd/no-segments-on-sliced-layers": "off",
      "fsd/segments-by-purpose": "off",
    },
  },
]);
