import { forwardRef, useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

export const CLASSES_ENTRADA =
  'w-full rounded-campo border border-borda bg-superficie px-3 py-2 text-corpo text-texto transition placeholder:text-texto-suave/70 hover:border-primaria/40 focus:border-primaria aria-[invalid=true]:border-erro';

interface Base {
  rotulo: string;
  erro?: string;
  ajuda?: string;
}

function Mensagens({ id, erro, ajuda }: { id: string; erro?: string; ajuda?: string }) {
  if (erro) {
    return (
      <p id={id} role="alert" className="mt-1 text-detalhe font-medium text-erro">
        {erro}
      </p>
    );
  }
  return ajuda ? (
    <p id={id} className="mt-1 text-detalhe text-texto-suave">
      {ajuda}
    </p>
  ) : null;
}

export const Campo = forwardRef<HTMLInputElement, Base & InputHTMLAttributes<HTMLInputElement>>(
  function Campo({ rotulo, erro, ajuda, ...resto }, ref) {
    const id = useId();
    const idMensagem = `${id}-mensagem`;
    return (
      <div>
        <label htmlFor={id} className="mb-1 block font-medium">
          {rotulo}
        </label>
        <input ref={ref} id={id} className={CLASSES_ENTRADA} aria-invalid={Boolean(erro)} aria-describedby={erro || ajuda ? idMensagem : undefined} {...resto} />
        <Mensagens id={idMensagem} erro={erro} ajuda={ajuda} />
      </div>
    );
  },
);

export const AreaTexto = forwardRef<HTMLTextAreaElement, Base & TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function AreaTexto({ rotulo, erro, ajuda, ...resto }, ref) {
    const id = useId();
    const idMensagem = `${id}-mensagem`;
    return (
      <div>
        <label htmlFor={id} className="mb-1 block font-medium">
          {rotulo}
        </label>
        <textarea ref={ref} id={id} rows={5} className={CLASSES_ENTRADA} aria-invalid={Boolean(erro)} aria-describedby={erro || ajuda ? idMensagem : undefined} {...resto} />
        <Mensagens id={idMensagem} erro={erro} ajuda={ajuda} />
      </div>
    );
  },
);
