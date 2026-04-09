/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  globalSetup: "./tests/global-setup.ts",
  globalTeardown: "./tests/global-teardown.ts",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
        allowJs: true,
      },
    ],
    "^.+\\.js$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
        allowJs: true,
      },
    ],
  },
  transformIgnorePatterns: [
    "/node_modules/.pnpm/(?!(arktype|arkregex|@ark\\+|nanoid))",
  ],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@hagerf-cv/renderer$": "<rootDir>/../../packages/cv-renderer/src/index.ts",
  },
  testTimeout: 30000,
};
