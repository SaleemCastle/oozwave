module.exports = {
    root: true,
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    parser: '@typescript-eslint/parser',
    parserOptions: {project: ['./tsconfig.json']},
    plugins: ['@typescript-eslint'],
    rules: {
        indent: ['error', 4],
        'no-var': 'error',
        semi: 'never',
        'no-multi-spaces': 'error',
        'space-in-parens': 'error',
        'no-multiple-empty-lines': 'error',
        'prefer-const': 'error',
        'no-use-before-define': 'error',
        'comma-dangle': 'error'
    }
}
