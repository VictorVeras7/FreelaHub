import bcrypt from 'bcryptjs';
import { SenhaHasher } from '../../../application/ports/SenhaHasher';

export class BcryptSenhaHasher implements SenhaHasher {
  constructor(private readonly custo: number = 10) {}

  gerar(senha: string): Promise<string> {
    return bcrypt.hash(senha, this.custo);
  }

  comparar(senha: string, hash: string): Promise<boolean> {
    return bcrypt.compare(senha, hash);
  }
}
