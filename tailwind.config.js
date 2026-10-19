/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        // Primary Indigo (accent)
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Neutral grays (slate-inspired, slightly warm)
        surface: {
          50:  '#f8f9fc',
          100: '#f1f2f6',
          200: '#e8eaf0',
          300: '#d8dce8',
          400: '#b0b6c6',
          500: '#8e95a3',
          600: '#6b7280',
          700: '#52596a',
          800: '#374151',
          900: '#1e2432',
        },
        // Success green
        success: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Warning amber
        warning: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        // Danger red
        danger: {
          50:  '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        // Keep tosca for backward compatibility
        tosca: {
          50:  '#f0fdf8',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        }
      },
      boxShadow: {
        'soft':    '0 2px 12px rgba(0, 0, 0, 0.05)',
        'card':    '0 2px 12px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0,0,0,0.04)',
        'modal':   '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0,0,0,0.06)',
        'glow':    '0 0 20px rgba(99, 102, 241, 0.25)',
        'glass':   '0 8px 32px rgba(31, 38, 135, 0.07)',
        'dropdown':'0 8px 30px rgba(0, 0, 0, 0.10)',
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      keyframes: {
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-bottom": {
          "0%":   { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
        "slide-in-right": {
          "0%":   { transform: "translateX(16px)", opacity: "0" },
          "100%": { transform: "translateX(0)",    opacity: "1" },
        },
        "zoom-in": {
          "0%":   { transform: "scale(0.94) translateY(8px)", opacity: "0" },
          "100%": { transform: "scale(1)    translateY(0)",   opacity: "1" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.6" },
        },
        "bounce-dot": {
          "0%, 100%": { transform: "scale(1)" },
          "50%":      { transform: "scale(1.4)" },
        }
      },
      animation: {
        "fade-in":         "fade-in 0.3s ease-out",
        "slide-in-bottom": "slide-in-bottom 0.4s ease-out forwards",
        "slide-in-right":  "slide-in-right  0.35s ease-out forwards",
        "zoom-in":         "zoom-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "pulse-slow":      "pulse-slow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-dot":      "bounce-dot 1.5s ease infinite",
      }
    },
  },
  plugins: [],
}
