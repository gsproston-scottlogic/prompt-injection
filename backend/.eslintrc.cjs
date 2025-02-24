/* eslint-env node */
module.exports = {
	root: true,
	settings: {
		'import/resolver': {
			alias: {
				map: [['@src', './src']],
				extensions: ['.ts', '.js', '.jsx', '.tsx', '.json', '.css'],
			},
		},
	},
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended-type-checked',
		'plugin:@typescript-eslint/stylistic-type-checked',
		'plugin:@typescript-eslint/strict-type-checked',
		'plugin:import/recommended',
		'plugin:import/typescript',
		'prettier',
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: ['./tsconfig.json', 'test/tsconfig.json'],
	},
	plugins: ['@typescript-eslint', 'jest'],
	ignorePatterns: ['build', 'coverage', 'node_modules'],
	rules: {
		eqeqeq: 'error',
		'func-style': ['error', 'declaration'],
		'no-restricted-imports': [
			'error',
			{
				patterns: ['../*'],
			},
		],
		'object-shorthand': 'error',
		'prefer-template': 'error',
		'import/order': [
			'error',
			{
				alphabetize: { order: 'asc' },
				'newlines-between': 'always',
				warnOnUnassignedImports: true,
				pathGroups: [
					{
						pattern: '@src/**',
						group: 'internal',
						position: 'before',
					},
				],
				groups: [
					['builtin', 'external'],
					['internal', 'parent', 'index', 'sibling'],
					['object', 'type'],
				],
			},
		],
		'jest/unbound-method': ['error', { ignoreStatic: true }],
		'@typescript-eslint/consistent-type-definitions': 0, // disable rule. Eventually use below rule to enforce type over interface
		// '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
		'@typescript-eslint/no-misused-promises': [
			'error',
			{
				checksVoidReturn: false,
			},
		],
		'@typescript-eslint/restrict-template-expressions': [
			'error',
			{
				allowNumber: true,
				allowBoolean: true,
			},
		],
		'@typescript-eslint/unbound-method': ['error', { ignoreStatic: true }],
	},
	overrides: [
		{
			files: ['*.test.ts'],
			plugins: ['jest'],
			rules: {
				'@typescript-eslint/unbound-method': 'off',
				'jest/unbound-method': 'error',
			},
		},
	],
};
