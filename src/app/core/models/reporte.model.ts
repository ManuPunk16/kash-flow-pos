/**
 * Métricas del dashboard
 */
export interface DashboardMetricas {
  ventasHoy: {
    cantidad: number;
    total: number;
    ganancia: number;
  };
  ventasMes: {
    cantidad: number;
    total: number;
    ganancia: number;
  };
  deudaTotal: number;
  stockBajo: number;
  ventasPorDia: Array<{
    fecha: string;
    total: number;
    cantidad: number;
  }>;
  topProductos: Array<{
    nombre: string;
    cantidadVendida: number;
    ingresos: number;
  }>;
}

/**
 * Reporte de ventas por período
 */
export interface ReporteVentas {
  fechaInicio: Date;
  fechaFin: Date;
  totalVentas: number;
  montoTotal: number;
  gananciaTotal: number;
  ventasPorMetodoPago: Record<string, number>;
  ventasPorDia: Array<{
    fecha: string;
    cantidad: number;
    monto: number;
  }>;
}

/**
 * Reporte de productos bajo stock
 */
export interface ProductoBajoStock {
  _id: string;
  nombre: string;
  stock: number;
  stockMinimo: number;
  categoria: string;
  precioVenta: number;
  esConsignacion: boolean;
}