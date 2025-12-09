import '../tipos/vercel';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { verificarAutenticacion } from '../middleware/autenticacion';
import {
  esquemaCrearCliente,
  esquemaActualizarCliente,
} from '../validacion/schemas';
import { ClientesService } from '../services/ClientesService';
import { Cliente } from '../models';

export default async (req: VercelRequest, res: VercelResponse) => {
  // ✅ CORS
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

  try {
    // ✅ Autenticación
    await verificarAutenticacion(req, res, () => {});

    if (!req.usuario) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const ruta = req.url || '/';

    // ✅ GET /api/clientes
    if (req.method === 'GET') {
      if (ruta === '/' || ruta === '') {
        const clientes = await ClientesService.obtenerTodos();
        res.status(200).json({
          exito: true,
          datos: clientes,
          cantidad: clientes.length,
        });
        return;
      }

      // GET /api/clientes/deudores/listado
      if (ruta.includes('deudores')) {
        const deudores = await ClientesService.obtenerDeudores();
        res.status(200).json({
          exito: true,
          datos: deudores,
          cantidad: deudores.length,
        });
        return;
      }

      // GET /api/clientes/[id]
      const clienteId = ruta.split('/')[1];
      if (clienteId && clienteId !== 'deudores') {
        const cliente = await ClientesService.obtenerPorId(clienteId);
        if (!cliente) {
          res
            .status(404)
            .json({ exito: false, error: 'Cliente no encontrado' });
          return;
        }
        res.status(200).json({ exito: true, dato: cliente });
        return;
      }
    }

    // ✅ POST /api/clientes
    if (req.method === 'POST') {
      const { error, value } = esquemaCrearCliente.validate(req.body);
      if (error) {
        res.status(400).json({
          exito: false,
          error: 'Validación fallida',
          detalles: error.details,
        });
        return;
      }

      const nuevoCliente = await ClientesService.crear({
        ...value,
        activo: true,
        saldoActual: 0,
        saldoHistorico: 0,
        esMoroso: false,
        diasSinPagar: 0,
        historicoIntereses: [],
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
      });

      res.status(201).json({
        exito: true,
        mensaje: 'Cliente creado exitosamente',
        dato: nuevoCliente,
      });
      return;
    }

    // ✅ PUT /api/clientes/[id]
    if (req.method === 'PUT') {
      const clienteId = ruta.split('/')[1];
      if (!clienteId) {
        res.status(400).json({ exito: false, error: 'ID requerido' });
        return;
      }

      const { error } = esquemaActualizarCliente.validate(req.body);
      if (error) {
        res.status(400).json({
          exito: false,
          error: 'Validación fallida',
          detalles: error.details,
        });
        return;
      }

      const clienteActualizado = await Cliente.findByIdAndUpdate(
        clienteId,
        { ...req.body, fechaActualizacion: new Date() },
        { new: true }
      );

      if (!clienteActualizado) {
        res.status(404).json({ exito: false, error: 'Cliente no encontrado' });
        return;
      }

      res.status(200).json({
        exito: true,
        mensaje: 'Cliente actualizado exitosamente',
        dato: clienteActualizado,
      });
      return;
    }

    // ✅ DELETE /api/clientes/[id]
    if (req.method === 'DELETE') {
      const clienteId = ruta.split('/')[1];
      if (!clienteId) {
        res.status(400).json({ exito: false, error: 'ID requerido' });
        return;
      }

      const clienteDesactivado = await Cliente.findByIdAndUpdate(
        clienteId,
        { activo: false, fechaActualizacion: new Date() },
        { new: true }
      );

      if (!clienteDesactivado) {
        res.status(404).json({ exito: false, error: 'Cliente no encontrado' });
        return;
      }

      res.status(200).json({
        exito: true,
        mensaje: 'Cliente desactivado exitosamente',
        dato: clienteDesactivado,
      });
      return;
    }

    res.status(405).json({ exito: false, error: 'Método no permitido' });
  } catch (error) {
    res.status(500).json({
      exito: false,
      error: 'Error al procesar solicitud',
      mensaje: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};
