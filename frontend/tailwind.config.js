/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#090d16",
        darkCard: "rgba(17, 25, 40, 0.75)",
        darkBorder: "rgba(255, 255, 255, 0.08)",
        brandCyan: "#00f2fe",
        brandIndigo: "#4facfe",
        brandAmber: "#f59e0b",
        brandRose: "#f43f5e",
        brandEmerald: "#10b981",
      },
      backgroundImage: {
        'futuristic-radial': 'radial-gradient(circle at 50% 50%, #1e293b 0%, #090d16 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'cyan-glow': '0 0 15px rgba(0, 242, 254, 0.4)',
        'rose-glow': '0 0 15px rgba(244, 63, 94, 0.4)',
        'emerald-glow': '0 0 15px rgba(16, 185, 129, 0.4)',
      },
      backdropBlur: {
        'glass': '12px',
      }
    },
  },
  plugins: [],
}
