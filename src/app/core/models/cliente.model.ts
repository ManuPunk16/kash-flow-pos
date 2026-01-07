export interface Cliente {
  _id: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  identificacion: string;
  direccion?: string;
  saldoActual: number;
  saldoHistorico: number;
  esMoroso: boolean;
  diasSinPagar: number;
  ultimaCompra: string | null;
  fechaUltimoCorteInteres: string | null;
  historicoIntereses: HistoricoInteres[];
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  limiteCredito?: number;
}

export interface HistoricoInteres {
  fecha: string;
  montoAplicado: number;
  nuevoSaldo: number;
  descripcion: string;
}
