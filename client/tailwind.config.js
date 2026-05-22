/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./App.tsx",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#785920", // base color
          100: "#7859201A", // 10% opacity
          200: "#78592033", // 20% opacity
          300: "#7859204D", // 30% opacity
          400: "#78592066", // 40% opacity
          500: "#78592080", // 50% opacity
          600: "#78592099", // 60% opacity
          700: "#785920B3", // 70% opacity
          800: "#785920CC", // 80% opacity
          900: "#785920E6", // 90% opacity
          // 600: "#645d59",
          // 700: "#785920",
          // 800: "#b89354cc", // 80% opacity
        },
        accent: "#B89354",
        canvas: "#FFF8F5",
        body: "#201B16",
        surface: "#fff8f5",
        inactive: "#A8A29E",
        active: "#B45309",
      },
      fontFamily: {
        jazera: ["jazera-bold"],
        tajwal: ["tajwal-meduim"],
        body: ["arabic-body"],
      },
    },
  },
  plugins: [],
};
