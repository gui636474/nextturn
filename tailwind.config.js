/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nt: {
          bg: '#0A0A0C',          // Fundo ultra-escuro elegante
          surface: '#141418',     // Superfície de cards discretos
          surface2: '#1C1C22',    // Superfície secundária para inputs/hover
          surface3: '#26262F',    // Destaque de bordas ativas
          border: '#22222B',      // Bordas sutis
          border2: '#2F2F3D',     // Bordas com maior contraste
          text: '#EDE8E1',        // Texto principal suave e confortável
          muted: '#9E978F',       // Texto secundário legível
          dim: '#6B655E',         // Texto esmaecido/detalhes
          bordeaux: {
            DEFAULT: '#72172C',   // Vinho bordô principal de destaque
            hover: '#8A1F37',     // Hover do bordô
            deep: '#4E0E1E',      // Bordô profundo
            glow: 'rgba(114, 23, 44, 0.25)',
          },
          gold: {
            DEFAULT: '#C5A059',   // Detalhes sofisticados / narrador
            light: '#DEC07E',
            glow: 'rgba(197, 160, 89, 0.2)',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        reading: ['Crimson Pro', 'Georgia', 'serif'],
        narrator: ['Cinzel', 'Georgia', 'serif'],
      },
      boxShadow: {
        'subtle': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'glow-bordeaux': '0 0 25px -5px rgba(114, 23, 44, 0.4)',
        'glow-gold': '0 0 20px -5px rgba(197, 160, 89, 0.3)',
      }
    },
  },
  plugins: [],
}
