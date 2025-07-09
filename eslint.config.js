import pluginJs from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
	pluginJs.configs.recommended,
	eslintConfigPrettier,

	{
		rules: {
			"no-unused-vars": "warn",
			"no-undef": "warn",
		},
	},
];
