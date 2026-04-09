import rootConfig from "../../eslint.config.js";
import globals from "globals";

export default [
  ...rootConfig,
  {
    files: ["**/*.cjs"],
    languageOptions: {
      globals: globals.commonjs,
    },
  },
];
