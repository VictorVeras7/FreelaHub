/** @type {import('tailwindcss').Config} */
const cor = (nome) => `rgb(var(--cor-${nome}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primaria: { DEFAULT: cor('primaria'), forte: cor('primaria'), suave: cor('secundaria') },
        oliva: cor('oliva'),
        fundo: cor('fundo'),
        superficie: cor('superficie'),
        texto: { DEFAULT: cor('texto'), suave: cor('texto-suave') },
        borda: cor('borda'),
        sucesso: { DEFAULT: cor('sucesso'), suave: cor('sucesso-suave') },
        alerta: { DEFAULT: cor('alerta'), suave: cor('alerta-suave') },
        erro: { DEFAULT: cor('erro'), suave: cor('erro-suave') },
        neutro: { DEFAULT: cor('texto-suave'), suave: cor('secundaria') },
      },
      fontFamily: {
        sans: ['"TASA Orbiter Variable"', 'system-ui', 'sans-serif'],
        display: ['Anton', 'Impact', 'sans-serif'],
      },
      fontSize: {
        titulo: ['clamp(2rem, 3.6vw, 3.25rem)', { lineHeight: '1.05' }],
        subtitulo: ['1.625rem', { lineHeight: '2rem', letterSpacing: '-0.02em', fontWeight: '600' }],
        corpo: ['0.9375rem', { lineHeight: '1.45rem' }],
        detalhe: ['0.75rem', { lineHeight: '1.1rem' }],
      },
      borderRadius: { campo: '0.75rem', cartao: '1.5rem' },
      boxShadow: {
        cartao: '0 10px 28px -14px rgb(0 0 0 / 0.22)',
        elevado: '0 22px 40px -16px rgb(0 0 0 / 0.32)',
        modal: '0 30px 80px -20px rgb(0 0 0 / 0.5)' },
      keyframes: {
        surgir: {
          from: { opacity: '0', transform: 'translateY(14px)', filter: 'blur(8px)' },
          to: { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
        },
        aparecer: { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: { surgir: 'surgir .6s cubic-bezier(.2,.7,.2,1)', aparecer: 'aparecer .2s ease-out' },
    },
  },
  plugins: [],
};
