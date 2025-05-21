module.exports = {
  darkMode: "class",
  purge: {
    content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
    options: {
      safelist: [
        'shake',
        'shake-container',
        'animate-pulse',
        /^ring-/,
        /^scale-/,
        /^z-/,
      ],
    },
  },
  theme: {
    extend: {
      animation: {
        'pulse': 'pulse 0.8s ease-in-out infinite',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
