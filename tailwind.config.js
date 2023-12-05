module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontSize: {
        xs: "0.75rem",
        sm: "0.875rem",
        base: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
        "4xl": "2.25rem",
        "5xl": "3rem",
        "6xl": "4rem",
      },
      keyframes: {
        working: {
          "0%": { transform: "translateY(0) rotate(0deg)" },
          "25%": { transform: "translateY(5px)" },
          "50%": { transform: "translateY(-2px) rotate(-1deg)" },
          "75%": { transform: "translateY(3px)" },
          "100%": { transform: "translateY(0) rotate(0deg)" },
        },
        jumping: {
          "0%": { transform: "translateY(0) rotate(0deg)" },
          "25%": { transform: "translateY(5px) rotate(2deg)" },
          "50%": { transform: "translateY(-2px)" },
          "75%": { transform: "translateY(3px)" },
          "100%": { transform: "translateY(0) rotate(0deg)" },
        },
        dropping: {
          "0%": {
            transform: "translateX(10px) translateY(-75px) rotate(12deg)",
          },
          "75%": { transform: "translateX(5px) rotate(3deg)" },
          "100%": { transform: "translateY(-2px) rotate(-3deg)" },
        },
      },
      animation: {
        working: "working 0.15s ease-in-out infinite",
        jumping: "jumping 0.15s ease-in-out infinite",
        dropping: "dropping 0.15s ease-in 1",
      },
    },
  },
  plugins: [],
};
