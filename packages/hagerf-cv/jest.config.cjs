/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
        diagnostics: false,
      },
    ],
  },
  // Allow ts-jest to transform arktype and its @ark/* and arkregex deps (they ship pure ESM).
  transformIgnorePatterns: [
    "node_modules/.pnpm/(?!(arktype@|@ark\\+|arkregex@))",
  ],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@hagerf-cv/renderer$":
      "<rootDir>/node_modules/@hagerf-cv/renderer/src/index.ts",
  },
};
