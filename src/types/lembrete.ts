export interface Lembrete {
  id: string;
  texto: string;
  concluido: boolean;
  criadoEm: Date;
  concluidoEm?: Date;
}