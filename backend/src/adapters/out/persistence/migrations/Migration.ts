export interface Migration {
  readonly versao: number;
  readonly nome: string;
  readonly up: string;
  readonly down: string;
}
