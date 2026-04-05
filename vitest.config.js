import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [vue()],
	test: {
		environment: "jsdom",
		globals: true,
		include: [
			"src/**/*.test.{js,ts,mjs,cjs,jsx,tsx}",
			"src/**/*.spec.{js,ts,mjs,cjs,jsx,tsx}",
		],
		exclude: ["tests/**", ".worktrees/**", "node_modules/**"],
		coverage: {
			provider: "v8",
		},
	},
});
