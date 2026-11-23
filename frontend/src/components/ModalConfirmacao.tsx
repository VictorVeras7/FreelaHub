import * as Dialog from '@radix-ui/react-dialog';
import { Botao } from './Botao';

interface Props {
  aberto: boolean;
  titulo: string;
  descricao: string;
  rotuloConfirmar: string;
  perigo?: boolean;
  carregando?: boolean;
  onConfirmar: () => void;
  onFechar: () => void;
}

export function ModalConfirmacao({ aberto, titulo, descricao, rotuloConfirmar, perigo, carregando, onConfirmar, onFechar }: Props) {
  return (
    <Dialog.Root open={aberto} onOpenChange={(valor) => !valor && !carregando && onFechar()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 animate-aparecer bg-texto/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-cartao bg-superficie p-6 shadow-modal">
          <Dialog.Title className="text-subtitulo">{titulo}</Dialog.Title>
          <Dialog.Description className="mt-2 text-texto-suave">{descricao}</Dialog.Description>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Botao variante="secundaria" onClick={onFechar} disabled={carregando}>
              Voltar
            </Botao>
            <Botao variante={perigo ? 'perigo' : 'primaria'} onClick={onConfirmar} carregando={carregando}>
              {rotuloConfirmar}
            </Botao>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
