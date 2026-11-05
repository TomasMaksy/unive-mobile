// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

/*
 * Design-system guardrails (see DESIGN.md). Every colour, font and size
 * comes from src/theme; every wait uses the brand loader. These rules make
 * drift a lint error instead of a code-review argument.
 *
 * A genuine one-off may be allowed with a comment that says why:
 *   // eslint-disable-next-line no-restricted-syntax -- optical nudge for the SF Symbol
 */
const colourRules = [
  {
    selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
    message: 'No hex colours outside src/theme. Use a role from `colors` (src/theme/colors.ts), or add a role there.',
  },
  {
    selector: 'Literal[value=/rgba?\\(|hsla?\\(/]',
    message: 'No rgb()/hsl() colours outside src/theme. Use a role from `colors`, or `alpha()` from @/theme for a tint.',
  },
  {
    selector: 'TemplateElement[value.raw=/rgba?\\(|#[0-9a-fA-F]{6}/]',
    message: 'No raw colours in template strings outside src/theme. Build gradients from `colors` roles or `fade()`.',
  },
];

const typeRules = ['fontSize', 'fontFamily', 'lineHeight', 'letterSpacing'].map((name) => ({
  selector: `Property[key.name='${name}']`,
  message: `Don't set ${name} in a screen. Use <Text variant="…"> or \`type.*\` from @/theme; if no step fits, the scale is missing one.`,
}));

const restrictedImports = {
  paths: [
    {
      name: 'react-native',
      importNames: ['ActivityIndicator'],
      message: 'Use <Loader /> (inline) or <Loading /> (a whole screen) from @/components/ui: the brand "un", not a spinner.',
    },
    {
      name: 'react-native',
      importNames: ['Text'],
      message: 'Use <Text variant="…"> from @/components/ui, so text stays on the brand type scale.',
    },
    {
      name: 'expo-haptics',
      message: 'Use `haptics` from @/theme, so the same moment always feels the same.',
    },
  ],
};

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  // Screens, features and app components: tokens and primitives only.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/theme/**', 'src/components/ui/**'],
    rules: {
      'no-restricted-syntax': ['error', ...colourRules, ...typeRules],
      'no-restricted-imports': ['error', restrictedImports],
    },
  },
  // The design system's own components may size their controls, but take colours from the theme.
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', ...colourRules],
    },
  },
]);
