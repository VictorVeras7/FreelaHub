/** @type {import('tailwindcss').Config} */
const cor = (nome) => `rgb(var(--cor-${nome}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primaria: { DEFAULT: cor('primaria'), forte: cor('primaria-forte'), suave: cor('secundaria') },
        violeta: cor('violeta'),
        fundo: cor('fundo'),
        superficie: cor('superficie'),
        texto: { DEFAULT: cor('texto'), suave: cor('texto-suave') },
        borda: cor('borda'),
        sucesso: { DEFAULT: cor('sucesso'), suave: cor('sucesso-suave') },
        alerta: { DEFAULT: cor('alerta'), suave: cor('alerta-suave') },
        erro: { DEFAULT: cor('erro'), suave: cor('erro-suave') },
        neutro: { DEFAULT: cor('texto-suave'), suave: cor('neutro-suave') },
      },
      fontFamily: { sans: ['"Inter Variable"', 'system-ui', 'sans-serif'] },
      fontSize: {
        titulo: ['1.75rem', { lineHeight: '2.25rem', letterSpacing: '-0.022em', fontWeight: '650' }],
        subtitulo: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.015em', fontWeight: '620' }],
        corpo: ['0.875rem', { lineHeight: '1.375rem' }],
        detalhe: ['0.75rem', { lineHeight: '1.125rem' }],
      },
      borderRadius: { campo: '0.625rem', cartao: '0.875rem' },
      boxShadow: {
        cartao: '0 1px 2px rgb(15 23 42 / 0.05)',
        elevado: '0 12px 28px -12px rgb(67 56 202 / 0.28), 0 2px 6px rgb(15 23 42 / 0.05)',
        modal: '0 24px 60px -16px rgb(15 23 42 / 0.4)',
      },
      keyframes: {
        surgir: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        aparecer: { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: { surgir: 'surgir .22s ease-out', aparecer: 'aparecer .15s ease-out' },
    },
  },
  plugins: [],
};
