import { VercelRequest, VercelResponse } from '@vercel/node';
import '../../src/tipos/vercel'; // Cargar tipos globales

// Importar handlers desde src/handlers (YA NO desde rutas/)
import abonosHandler from '../../src/handlers/abonos';
import clientesHandler from '../../src/handlers/clientes';
import productosHandler from '../../src/handlers/productos';
import ventasHandler from '../../src/handlers/ventas';
import interesesHandler from '../../src/handlers/intereses';
import authHandler from '../../src/handlers/auth';

export default async (req: VercelRequest, res: VercelResponse) => {
  const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);

  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Enrutamiento
  if (pathname.startsWith('/api/abonos')) return abonosHandler(req, res);
  if (pathname.startsWith('/api/clientes')) return clientesHandler(req, res);
  if (pathname.startsWith('/api/productos')) return productosHandler(req, res);
  if (pathname.startsWith('/api/ventas')) return ventasHandler(req, res);
  if (pathname.startsWith('/api/intereses')) return interesesHandler(req, res);
  if (pathname.startsWith('/api/auth')) return authHandler(req, res);

  res.status(404).json({ error: 'Ruta no encontrada', pathname });
};

// export { Usuario, type IUsuario, type IPermisos } from './Usuario';
// export { Producto, type IProducto } from './Producto';
// export { Cliente, type ICliente, type IHistoricoInteres } from './Cliente';
// export { Venta, type IVenta, type IItemVenta } from './Venta';
// export { AbonoCliente, type IAbonoCliente } from './AbonoCliente';
// export { Proveedor, type IProveedor } from './Proveedor';
// export { PagoProveedor, type IPagoProveedor } from './PagoProveedor';
