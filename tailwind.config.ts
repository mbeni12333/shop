import type { Config } from 'tailwindcss';

/** EDoctor tokens mirror website/edoctor-design-system/theme.css. */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ed: {
          bg: '#FCFBFE',
          surface: '#FFFFFF',
          soft: '#F2EDFC',
          ink: '#242033',
          muted: '#686274',
          purple: '#6840C6',
          'purple-hover': '#5330A6',
          pale: '#E8DFF9',
          border: '#DDD7E6',
          control: '#898092',
          green: '#27634B',
          'green-bg': '#E9F3ED',
          red: '#AC3045',
          'red-bg': '#FFF0F2',
        },
        // Aliases retain compatibility with the repository's shared components.
        primary: { DEFAULT: '#6840C6', light: '#E8DFF9', dark: '#5330A6' },
        surface: { DEFAULT: '#FFFFFF', alt: '#F2EDFC' },
        border: '#DDD7E6',
        text: { DEFAULT: '#242033', muted: '#686274' },
        success: '#27634B',
        error: '#AC3045',
      },
      fontFamily: { sans: ['Segoe UI', 'Arial', 'sans-serif'] },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.5' }],
        sm: ['0.875rem', { lineHeight: '1.5' }],
        base: ['1rem', { lineHeight: '1.65' }],
        lg: ['1.125rem', { lineHeight: '1.65' }],
        xl: ['1.5rem', { lineHeight: '1.25' }],
        '2xl': ['2rem', { lineHeight: '1.2' }],
        '3xl': ['3rem', { lineHeight: '1.1' }],
        hero: ['clamp(2.6rem, 4.6vw, 4.5rem)', { lineHeight: '1.08' }],
      },
      maxWidth: { page: '1920px', reading: '700px' },
      minHeight: { touch: '44px', control: '48px' },
      borderRadius: { control: '8px', card: '16px', section: '24px' },
      transitionDuration: { ed: '160ms' },
      boxShadow: { float: '0 12px 32px rgb(36 32 51 / 8%)' },
    },
  },
  plugins: [],
};
export default config;
