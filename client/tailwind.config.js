/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        // Enhanced Medical Professional Color Palette
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
        medical: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        trust: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        accent: {
          50: "#fdf4ff",
          100: "#fae8ff",
          200: "#f5d0fe",
          300: "#f0abfc",
          400: "#e879f9",
          500: "#d946ef",
          600: "#c026d3",
          700: "#a21caf",
          800: "#86198f",
          900: "#701a75",
          950: "#4a044e",
        },
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },
        error: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
          950: "#450a0a",
        },
      },
      fontFamily: {
        sans: [
          "Inter var",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        display: ["Cal Sans", "Inter var", "Inter", "system-ui", "sans-serif"],
        mono: [
          '"SF Mono"',
          "Monaco",
          "Inconsolata",
          '"Roboto Mono"',
          "monospace",
        ],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1.1" }],
        "6xl": ["3.75rem", { lineHeight: "1.1" }],
        "7xl": ["4.5rem", { lineHeight: "1.1" }],
        "8xl": ["6rem", { lineHeight: "1.1" }],
        "9xl": ["8rem", { lineHeight: "1.1" }],
      },
      spacing: {
        4.5: "1.125rem",
        5.5: "1.375rem",
        6.5: "1.625rem",
        18: "4.5rem",
        22: "5.5rem",
        26: "6.5rem",
        30: "7.5rem",
        34: "8.5rem",
        38: "9.5rem",
        128: "32rem",
        144: "36rem",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
        "6xl": "3rem",
      },
      boxShadow: {
        medical:
          "0 4px 6px -1px rgba(16, 185, 129, 0.1), 0 2px 4px -1px rgba(16, 185, 129, 0.06)",
        "medical-lg":
          "0 10px 15px -3px rgba(16, 185, 129, 0.1), 0 4px 6px -2px rgba(16, 185, 129, 0.05)",
        trust:
          "0 4px 6px -1px rgba(100, 116, 139, 0.1), 0 2px 4px -1px rgba(100, 116, 139, 0.06)",
        "trust-lg":
          "0 10px 15px -3px rgba(100, 116, 139, 0.1), 0 4px 6px -2px rgba(100, 116, 139, 0.05)",
        glow: "0 0 20px rgba(14, 165, 233, 0.3)",
        "glow-medical": "0 0 20px rgba(16, 185, 129, 0.3)",
        "inner-light": "inset 0 2px 4px 0 rgba(255, 255, 255, 0.06)",
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        "elevation-1":
          "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        "elevation-2":
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "elevation-3":
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        "elevation-4":
          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "fade-in-up": "fadeInUp 0.6s ease-out",
        "fade-in-down": "fadeInDown 0.6s ease-out",
        "slide-in-right": "slideInRight 0.4s ease-out",
        "slide-in-left": "slideInLeft 0.4s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "bounce-gentle": "bounceGentle 0.8s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "gradient-shift": "gradientShift 3s ease infinite",
        shimmer: "shimmer 2s linear infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        "card-hover": "cardHover 0.3s ease-out",
        typing: "typing 3.5s steps(40, end)",
        blink: "blink 1s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        bounceGentle: {
          "0%, 20%, 40%, 60%, 80%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(14, 165, 233, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(14, 165, 233, 0.5)" },
        },
        cardHover: {
          "0%": { transform: "translateY(0) scale(1)" },
          "100%": { transform: "translateY(-4px) scale(1.02)" },
        },
        typing: {
          "0%": { width: "0" },
          "100%": { width: "100%" },
        },
        blink: {
          "0%, 50%": { borderColor: "transparent" },
          "51%, 100%": { borderColor: "currentColor" },
        },
      },
      backdropBlur: {
        xs: "2px",
        "4xl": "72px",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "medical-pattern":
          "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        "trust-pattern":
          "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2364748b' fill-opacity='0.02' fill-rule='evenodd'%3E%3Cpath d='m0 40l40-40h-40v40zm40 0v-40h-40l40 40z'/%3E%3C/g%3E%3C/svg%3E\")",
      },
      transitionDuration: {
        400: "400ms",
        600: "600ms",
      },
      transitionTimingFunction: {
        "bounce-in": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/aspect-ratio"),
    require("@tailwindcss/typography"),
    // Custom Medical Platform Plugin
    function ({ addUtilities, addComponents, theme }) {
      const newUtilities = {
        // Glass morphism utilities
        ".glass": {
          background: "rgba(255, 255, 255, 0.25)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.18)",
        },
        ".glass-dark": {
          background: "rgba(0, 0, 0, 0.25)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
        ".glass-medical": {
          background: "rgba(16, 185, 129, 0.1)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(16, 185, 129, 0.2)",
        },
        // Gradient utilities
        ".gradient-medical": {
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        },
        ".gradient-primary": {
          background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
        },
        ".gradient-trust": {
          background: "linear-gradient(135deg, #64748b 0%, #475569 100%)",
        },
        ".gradient-accent": {
          background: "linear-gradient(135deg, #d946ef 0%, #a21caf 100%)",
        },
        // Text gradients
        ".text-gradient-medical": {
          background: "linear-gradient(135deg, #10b981, #059669)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        },
        ".text-gradient-primary": {
          background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        },
        // Medical themed patterns
        ".pattern-medical": {
          backgroundImage: theme("backgroundImage.medical-pattern"),
        },
        ".pattern-trust": {
          backgroundImage: theme("backgroundImage.trust-pattern"),
        },
        // Custom scrollbar utilities for news cards
        ".scrollbar-thin": {
          scrollbarWidth: "thin",
          scrollbarColor: "rgb(203 213 225) transparent",
        },
        ".scrollbar-thin::-webkit-scrollbar": {
          width: "6px",
        },
        ".scrollbar-thin::-webkit-scrollbar-track": {
          background: "transparent",
        },
        ".scrollbar-thin::-webkit-scrollbar-thumb": {
          background: "rgb(203 213 225)",
          borderRadius: "3px",
        },
        ".scrollbar-thin::-webkit-scrollbar-thumb:hover": {
          background: "rgb(148 163 184)",
        },
        ".scrollbar-thumb-slate-300::-webkit-scrollbar-thumb": {
          background: "rgb(203 213 225)",
        },
        ".scrollbar-thumb-slate-400:hover::-webkit-scrollbar-thumb:hover": {
          background: "rgb(148 163 184)",
        },
        ".scrollbar-track-transparent::-webkit-scrollbar-track": {
          background: "transparent",
        },
      };

      const newComponents = {
        // Enhanced button components
        ".btn-medical": {
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          color: "white",
          padding: "0.75rem 2rem",
          borderRadius: "0.75rem",
          fontWeight: "600",
          fontSize: "0.875rem",
          boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 25px rgba(16, 185, 129, 0.4)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
        },
        ".btn-primary-enhanced": {
          background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
          color: "white",
          padding: "0.75rem 2rem",
          borderRadius: "0.75rem",
          fontWeight: "600",
          fontSize: "0.875rem",
          boxShadow: "0 4px 15px rgba(14, 165, 233, 0.3)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 25px rgba(14, 165, 233, 0.4)",
          },
        },
        ".btn-ghost-enhanced": {
          background: "transparent",
          color: theme("colors.trust.600"),
          padding: "0.75rem 2rem",
          borderRadius: "0.75rem",
          fontWeight: "500",
          fontSize: "0.875rem",
          border: `1px solid ${theme("colors.trust.200")}`,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            background: theme("colors.trust.50"),
            borderColor: theme("colors.trust.300"),
            transform: "translateY(-1px)",
          },
        },
        // Enhanced card components
        ".card-medical": {
          background: "white",
          borderRadius: "1rem",
          padding: "1.5rem",
          boxShadow: theme("boxShadow.medical"),
          border: `1px solid ${theme("colors.medical.100")}`,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            boxShadow: theme("boxShadow.medical-lg"),
            transform: "translateY(-2px)",
            borderColor: theme("colors.medical.200"),
          },
        },
        ".card-trust": {
          background: "white",
          borderRadius: "1rem",
          padding: "1.5rem",
          boxShadow: theme("boxShadow.trust"),
          border: `1px solid ${theme("colors.trust.100")}`,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            boxShadow: theme("boxShadow.trust-lg"),
            transform: "translateY(-2px)",
            borderColor: theme("colors.trust.200"),
          },
        },
        ".card-glass": {
          background: "rgba(255, 255, 255, 0.25)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: "1rem",
          padding: "1.5rem",
          border: "1px solid rgba(255, 255, 255, 0.18)",
          boxShadow: theme("boxShadow.glass"),
        },
        // Enhanced input components
        ".input-medical": {
          width: "100%",
          padding: "0.75rem 1rem",
          fontSize: "0.875rem",
          borderRadius: "0.75rem",
          border: `2px solid ${theme("colors.trust.200")}`,
          backgroundColor: "white",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:focus": {
            outline: "none",
            borderColor: theme("colors.medical.400"),
            boxShadow: `0 0 0 3px ${theme("colors.medical.100")}`,
          },
          "&::placeholder": {
            color: theme("colors.trust.400"),
          },
        },
        // Status badges with enhanced design
        ".badge-verified": {
          display: "inline-flex",
          alignItems: "center",
          padding: "0.25rem 0.75rem",
          borderRadius: "9999px",
          fontSize: "0.75rem",
          fontWeight: "600",
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          color: "white",
          boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
        },
        ".badge-pending": {
          display: "inline-flex",
          alignItems: "center",
          padding: "0.25rem 0.75rem",
          borderRadius: "9999px",
          fontSize: "0.75rem",
          fontWeight: "600",
          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          color: "white",
          boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)",
        },
      };

      addUtilities(newUtilities);
      addComponents(newComponents);
    },
  ],
};
