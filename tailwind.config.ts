import type { Config } from 'tailwindcss';

/**
 * EDoctor tokens. The hex values live once, as HSL channels in
 * src/styles/edoctor.css `:root`; this file only wires them to semantic names.
 * Palette mirrors website/edoctor-design-system/theme.css.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem 2rem',
      screens: { '2xl': '1920px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          strong: 'hsl(var(--primary-strong))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
          surface: 'hsl(var(--success-surface))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      // --radius 12px gives: sm 8px (controls), md 10px, lg 12px,
      // 2xl 16px (cards), 3xl 24px (sections) from Tailwind defaults.
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
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
      spacing: { touch: 'var(--control-size)' },
      minHeight: {
        touch: 'var(--control-size)',
        control: 'var(--control-size)',
      },
      transitionDuration: { ed: 'var(--motion-fast)' },
      boxShadow: { float: '0 12px 32px hsl(var(--shadow) / 8%)' },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'slide-in-from-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-in-from-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: {
        'accordion-down': 'accordion-down 200ms ease-out',
        'accordion-up': 'accordion-up 200ms ease-out',
        'slide-in-from-left': 'slide-in-from-left 240ms ease-out',
        'slide-in-from-right': 'slide-in-from-right 240ms ease-out',
        'fade-in': 'fade-in 160ms ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
