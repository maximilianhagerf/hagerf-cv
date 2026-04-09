import rootConfig from "../../eslint.config.js";

export default [
  ...rootConfig,
  {
    // CommonJS config/mock files need `module` and `require` globals
    files: ["**/*.cjs"],
    languageOptions: {
      globals: {
        module: "writable",
        require: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
  },
];
