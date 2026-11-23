/** Converte um campo do JSON em texto; tipos inesperados viram vazio e são recusados pelo caso de uso. */
export const texto = (valor: unknown): string => (typeof valor === 'string' ? valor : '');
