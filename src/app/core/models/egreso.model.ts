export interface Egreso {
  _id: string;
  numeroEgreso: string;
  concepto: string;
  descripcion?: string;
  monto: number;
  categoria:
    | 'servicios'
    | 'nomina'
    | 'insumos'
    | 'mantenimiento'
    | 'transporte'
    | 'otros';
  metodoPago: 'efectivo' | 'transferencia' | 'tarjeta';
  referenciaPago?: string;
  beneficiario?: string;
  usuarioId: string;
  nombreUsuario: string;
  fechaEgreso: Date;
  adjuntos?: string[];
  observaciones?: string;
  aprobado: boolean;
  aprobadoPor?: string;
  fechaAprobacion?: Date;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export interface CrearEgresoDto {
  concepto: string;
  descripcion?: string;
  monto: number;
  categoria:
    | 'servicios'
    | 'nomina'
    | 'insumos'
    | 'mantenimiento'
    | 'transporte'
    | 'otros';
  metodoPago: 'efectivo' | 'transferencia' | 'tarjeta';
  referenciaPago?: string;
  beneficiario?: string;
  observaciones?: string;
  fechaEgreso?: Date;
}
