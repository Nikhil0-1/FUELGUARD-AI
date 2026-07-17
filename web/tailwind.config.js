/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'russian-white': '#F8F8F6',
        'card-white': '#FFFFFF',
        'luxury-gold': '#C9A96E',
        'luxury-gold-light': '#D4BC8E',
        'luxury-gold-dark': '#B8944D',
        'soft-blue': '#6B9BD2',
        'soft-blue-light': '#8DB4DE',
        'soft-blue-dark': '#4A7FBF',
        'soft-pink': '#F2E4E1',
        'soft-pink-dark': '#E5CEC9',
        'text-primary': '#1A1A2E',
        'text-secondary': '#6B7280',
        'text-muted': '#9CA3AF',
        'border-light': '#E5E7EB',
        'success': '#4CAF50',
        'success-light': '#E8F5E9',
        'warning': '#FF9800',
        'warning-light': '#FFF3E0',
        'danger': '#EF4444',
        'danger-light': '#FEE2E2',
        'info': '#2196F3',
        'info-light': '#E3F2FD',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 25px rgba(0, 0, 0, 0.06), 0 4px 10px rgba(0, 0, 0, 0.04)',
        'nav': '0 1px 3px rgba(0, 0, 0, 0.05)',
        'modal': '0 25px 50px rgba(0, 0, 0, 0.15)',
        'gold': '0 4px 14px rgba(201, 169, 110, 0.25)',
        'blue': '0 4px 14px rgba(107, 155, 210, 0.25)',
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201, 169, 110, 0.2)' },
          '50%': { boxShadow: '0 0 0 10px rgba(201, 169, 110, 0)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
};
