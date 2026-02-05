import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
    './vendor/laravel/fortify/src/views/*.blade.php',
    './storage/framework/views/*.php',
    './resources/views/**/*.blade.php',
    './resources/js/**/*.tsx',
    './resources/js/**/*.ts',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        // Paleta Corporativa Atinet (OKLCH)

        // Light Mode - Colores Principales
        primary: {
          light: '#0066cc', // oklch(0.45 0.12 240)
          DEFAULT: '#0066cc',
          foreground: '#ffffff',
        },
        secondary: {
          light: '#f5d06c', // oklch(0.85 0.12 85) - Dorado Atinet
          DEFAULT: '#f5d06c',
          foreground: '#0d0d0d',
        },
        accent: {
          light: '#ffc107', // oklch(0.80 0.15 85) - Dorado Brillante
          DEFAULT: '#ffc107',
          foreground: '#000000',
        },

        // Dark Mode - Colores Adaptados
        primary_dark: {
          light: '#4d9fff', // oklch(0.60 0.15 240)
          DEFAULT: '#4d9fff',
          foreground: '#ffffff',
        },
        secondary_dark: {
          light: '#f9d45e', // oklch(0.75 0.15 85)
          DEFAULT: '#f9d45e',
          foreground: '#000000',
        },
        accent_dark: {
          light: '#ffca28', // oklch(0.85 0.18 85)
          DEFAULT: '#ffca28',
          foreground: '#000000',
        },

        // Estados y Utilidades
        background: {
          light: '#fdfcfb', // oklch(0.99 0.002 240)
          dark: '#1a2940', // oklch(0.18 0.015 240)
        },
        foreground: {
          light: '#3d3d3d', // oklch(0.25 0.015 240)
          dark: '#f5f3ff', // oklch(0.95 0.005 240)
        },
        card: {
          light: '#ffffff', // oklch(1 0 0)
          dark: '#243054', // oklch(0.22 0.015 240)
        },
        border: {
          light: '#e8e3e8', // oklch(0.90 0.01 240)
          dark: '#3d5873', // oklch(0.35 0.015 240)
        },
        muted: {
          light: '#7f7f7f', // oklch(0.50 0.01 240)
          dark: '#a8a8a8', // oklch(0.65 0.01 240)
        },

        // Gráficas (Light Mode)
        chart: {
          1: '#0066cc', // Azul Atinet
          2: '#f5d06c', // Dorado Atinet
          3: '#2d5a8c', // Azul oscuro
          4: '#4fa8e6', // Cyan
          5: '#8b6bb7', // Violeta
        },

        // Gráficas (Dark Mode)
        chart_dark: {
          1: '#4d9fff', // Azul brillante
          2: '#f9d45e', // Dorado brillante
          3: '#67c3ff', // Cyan brillante
          4: '#8b6bb7', // Violeta
          5: '#5bcf9f', // Verde azulado
        },

        // Estados
        success: '#10b981', // Verde
        warning: '#f59e0b', // Amarillo
        error: '#ef4444', // Rojo
        info: '#3b82f6', // Azul
      },
      backgroundColor: {
        // Light Mode
        DEFAULT: '#fdfcfb',
        card: '#ffffff',
        sidebar: 'oklch(0.48 0.12 240)', // Azul corporativo

        // Dark Mode
        dark: '#1a2940',
        'card-dark': '#243054',
        'sidebar-dark': 'oklch(0.25 0.020 240)', // Azul oscuro profundo
      },
      textColor: {
        // Light Mode
        DEFAULT: '#3d3d3d',

        // Dark Mode
        'dark': '#f5f3ff',
      },
      borderColor: {
        // Light Mode
        DEFAULT: '#e8e3e8',

        // Dark Mode
        dark: '#3d5873',
      },
      ringColor: {
        primary: '#0066cc',
        secondary: '#f5d06c',
        accent: '#ffc107',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-in-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
      },
      backdropFilter: {
        'glass-light': 'backdrop-blur(10px) brightness(1.1)',
        'glass-dark': 'backdrop-blur(10px) brightness(0.9)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 102, 204, 0.25)',
        'glow-secondary': '0 0 20px rgba(245, 208, 108, 0.2)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [
    forms,
    typography,
    // Plugin para glassmorphism
    function({ addComponents }: { addComponents: (components: Record<string, Record<string, unknown>>) => void }) {
      addComponents({
        '.glass-light': {
          '@apply bg-white/70 backdrop-blur-lg border border-white/20 rounded-xl':
            {},
        },
        '.glass-dark': {
          '@apply bg-slate-900/70 backdrop-blur-lg border border-slate-700/20 rounded-xl':
            {},
        },
        '.sidebar-item-active': {
          '@apply bg-secondary text-secondary-foreground': {},
        },
      });
    },
  ],
};
