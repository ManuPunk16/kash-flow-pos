import reportesHandler from '../../_lib/handlers/reportes.js';

export * from './Usuario.js';
export * from './Producto.js';
export * from './Cliente.js';
export * from './Venta.js';
export * from './AbonoCliente.js';
export * from './Proveedor.js';
export * from './PagoProveedor.js';

if (pathname.startsWith('/api/reportes'))
  return await reportesHandler(req, res);
