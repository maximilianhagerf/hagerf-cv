/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts", "**/tests/**/*.test.tsx"],
  transform: {
    // Transform TypeScript and plain JS (for ESM node_modules like arktype)
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
        diagnostics: false,
      },
    ],
  },
  // In a pnpm workspace, all package files live under node_modules/.pnpm/<pkg>@<ver>/node_modules/.
  // Allow ts-jest to transform arktype and its @ark/* and arkregex deps (they ship pure ESM).
  transformIgnorePatterns: [
    "node_modules/.pnpm/(?!(arktype@|@ark\\+|arkregex@))",
  ],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "\\.css$": "<rootDir>/tests/__mocks__/fileMock.cjs",
  },
};
