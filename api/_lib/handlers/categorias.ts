import { AuthenticatedRequest } from '../tipos/AuthenticatedRequest.js';
import { VercelResponse } from '@vercel/node';
import { verificarAutenticacion } from '../middleware/autenticacion.js';
import { Producto } from '../models/index.js';
import { conectarMongoDB } from '../config/database.js';

export default async (req: AuthenticatedRequest, res: VercelResponse) => {
  // CORS headers (igual que en otros handlers)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ exito: false, error: 'Método no permitido' });
    return;
  }

  try {
    await conectarMongoDB();

    let autenticado = false;
    await verificarAutenticacion(req, res, () => {
      autenticado = true;
    });

    if (!autenticado || !req.usuario) {
      return;
    }

    // Obtener categorías únicas de productos activos
    const categorias = await Producto.distinct('categoria', { activo: true });

    // Contar productos por categoría
    const categoriasConConteo = await Promise.all(
      categorias.map(async (categoria) => ({
        nombre: categoria,
        cantidadProductos: await Producto.countDocuments({
          activo: true,
          categoria,
        }),
      }))
    );

    res.status(200).json({
      exito: true,
      datos: categoriasConConteo.sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
      ),
      cantidad: categoriasConConteo.length,
    });
  } catch (error) {
    console.error('❌ Error en categorías API:', error);
    res.status(500).json({
      exito: false,
      error: 'Error al obtener categorías',
    });
  }
};
