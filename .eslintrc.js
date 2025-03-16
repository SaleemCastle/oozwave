module.exports = {
    root: true,
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:react/recommended', 'plugin:react-native/all'],
    parser: '@typescript-eslint/parser',
    parserOptions: {project: ['./tsconfig.json']},
    plugins: ['@typescript-eslint', 'react', 'react-native'],
    env: {
        'react-native/react-native': true,
    },
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
