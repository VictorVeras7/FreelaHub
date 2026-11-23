import { CheckCircle2 } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

interface ToastItem {
  id: number;
  texto: string;
}

const ToastContext = createContext<(texto: string) => void>(() => undefined);

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ToastItem[]>([]);
  const proximo = useRef(1);

  const mostrar = useCallback((texto: string) => {
    const id = proximo.current++;
    setItens((atuais) => [...atuais, { id, texto }]);
    setTimeout(() => setItens((atuais) => atuais.filter((item) => item.id !== id)), 4000);
  }, []);

  const valor = useMemo(() => mostrar, [mostrar]);

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div aria-live="polite" className="fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {itens.map((item) => (
          <div key={item.id} role="status" className="flex animate-surgir items-center gap-2 rounded-campo border border-borda bg-superficie px-4 py-3 font-medium shadow-elevado">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-sucesso" aria-hidden />
            {item.texto}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
