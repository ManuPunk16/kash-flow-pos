import { AuthenticatedRequest } from '../tipos/AuthenticatedRequest.js';
import { VercelResponse } from '@vercel/node';
import { verificarAutenticacion } from '../middleware/autenticacion.js';
import { Cliente } from '../models/index.js';
import { conectarMongoDB } from '../config/database.js';

export default async (req: AuthenticatedRequest, res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
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

    const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);
    const rutaInteres = pathname.replace('/api/intereses', '') || '/';

    // ===========================
    // GET /api/intereses — Resumen general
    // ===========================
    if (req.method === 'GET' && (rutaInteres === '/' || rutaInteres === '')) {
      const hoy = new Date();
      const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

      const clientesConDeuda = await Cliente.find({
        activo: true,
        saldoActual: { $gt: 0 },
      })
        .select('nombre apellido saldoActual fechaUltimoCorteInteres')
        .lean();

      const conInteresAplicado = clientesConDeuda.filter(
        (c) =>
          c.fechaUltimoCorteInteres &&
          c.fechaUltimoCorteInteres >= primerDiaMes &&
          c.fechaUltimoCorteInteres <= ultimoDiaMes,
      );

      const montoTotalDeuda = clientesConDeuda.reduce(
        (sum, c) => sum + c.saldoActual,
        0,
      );

      res.status(200).json({
        exito: true,
        resumen: {
          clientesConDeuda: clientesConDeuda.length,
          clientesConInteresAplicado: conInteresAplicado.length,
          clientesPendientes:
            clientesConDeuda.length - conInteresAplicado.length,
          montoTotalDeuda,
          proyeccionIntereses: montoTotalDeuda * 0.2,
          mesActual: hoy.toLocaleDateString('es-ES', {
            month: 'long',
            year: 'numeric',
          }),
        },
        // ✅ Se agrega _id para poder usar el endpoint individual desde el frontend
        detalleClientes: clientesConDeuda.map((cliente) => ({
          _id: cliente._id.toString(),
          nombre: `${cliente.nombre} ${cliente.apellido}`,
          deudaActual: cliente.saldoActual,
          interesProyectado: cliente.saldoActual * 0.2,
          interesAplicado: conInteresAplicado.some(
            (c) => c._id.toString() === cliente._id.toString(),
          ),
        })),
      });
      return;
    }

    // ===========================
    // POST /api/intereses/corte/:clienteId — Corte individual
    // ✅ Debe ir ANTES del corte masivo para que el regex no colisione
    // ===========================
    const matchIndividual = rutaInteres.match(/^\/corte\/([0-9a-fA-F]{24})$/);
    if (req.method === 'POST' && matchIndividual) {
      const clienteId = matchIndividual[1];
      const hoy = new Date();

      const cliente = await Cliente.findById(clienteId);

      if (!cliente || !cliente.activo) {
        res.status(404).json({ exito: false, error: 'Cliente no encontrado' });
        return;
      }

      if (cliente.saldoActual <= 0) {
        res.status(400).json({
          exito: false,
          error: 'El cliente no tiene deuda activa',
        });
        return;
      }

      // Evitar duplicado en el mismo mes
      if (
        cliente.fechaUltimoCorteInteres &&
        cliente.fechaUltimoCorteInteres.getMonth() === hoy.getMonth() &&
        cliente.fechaUltimoCorteInteres.getFullYear() === hoy.getFullYear()
      ) {
        res.status(400).json({
          exito: false,
          error: 'El interés de este mes ya fue aplicado a este cliente',
        });
        return;
      }

      const saldoAnterior = cliente.saldoActual;
      const montoInteres = saldoAnterior * 0.2;
      const nuevoSaldo = saldoAnterior + montoInteres;

      cliente.saldoActual = nuevoSaldo;
      cliente.fechaUltimoCorteInteres = hoy;
      cliente.historicoIntereses.push({
        fecha: hoy,
        montoAplicado: montoInteres,
        nuevoSaldo,
        descripcion: `Interés mes ${hoy.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`,
      });

      await cliente.save();

      res.status(200).json({
        exito: true,
        mensaje: `✅ Interés aplicado a ${cliente.nombre} ${cliente.apellido}`,
        detalle: {
          cliente: `${cliente.nombre} ${cliente.apellido}`,
          saldoAnterior,
          montoInteres,
          nuevoSaldo,
        },
      });
      return;
    }

    // ===========================
    // POST /api/intereses/corte — Corte masivo
    // ===========================
    if (req.method === 'POST' && rutaInteres === '/corte') {
      const hoy = new Date();

      const clientesConDeuda = await Cliente.find({
        activo: true,
        saldoActual: { $gt: 0 },
      });

      if (clientesConDeuda.length === 0) {
        res
          .status(400)
          .json({ exito: false, error: 'No hay clientes con deuda' });
        return;
      }

      const resultados = {
        procesados: 0,
        yaConInteresAplicado: 0,
        errores: [] as string[],
        detalles: [] as {
          cliente: string;
          saldoAnterior: number;
          montoInteres: number;
          nuevoSaldo: number;
        }[],
      };

      for (const cliente of clientesConDeuda) {
        try {
          if (
            cliente.fechaUltimoCorteInteres &&
            cliente.fechaUltimoCorteInteres.getMonth() === hoy.getMonth() &&
            cliente.fechaUltimoCorteInteres.getFullYear() === hoy.getFullYear()
          ) {
            resultados.yaConInteresAplicado++;
            continue;
          }

          const saldoAnterior = cliente.saldoActual;
          const montoInteres = saldoAnterior * 0.2;
          const nuevoSaldo = saldoAnterior + montoInteres;

          cliente.saldoActual = nuevoSaldo;
          cliente.fechaUltimoCorteInteres = hoy;
          cliente.historicoIntereses.push({
            fecha: hoy,
            montoAplicado: montoInteres,
            nuevoSaldo,
            descripcion: `Interés mes ${hoy.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`,
          });

          await cliente.save();

          resultados.procesados++;
          resultados.detalles.push({
            cliente: `${cliente.nombre} ${cliente.apellido}`,
            saldoAnterior,
            montoInteres,
            nuevoSaldo,
          });
        } catch (err) {
          resultados.errores.push(
            `${cliente.nombre}: ${err instanceof Error ? err.message : 'Error desconocido'}`,
          );
        }
      }

      res.status(200).json({
        exito: true,
        mensaje: '✅ Corte de mes ejecutado',
        resumen: {
          clientesProcesados: resultados.procesados,
          clientesYaConInteres: resultados.yaConInteresAplicado,
          errores: resultados.errores.length,
        },
        detalles: resultados.detalles,
        errores: resultados.errores.length > 0 ? resultados.errores : undefined,
      });
      return;
    }

    // ===========================
    // GET /api/intereses/historial/:clienteId
    // ===========================
    if (req.method === 'GET' && rutaInteres.includes('/historial/')) {
      const clienteId = rutaInteres.split('/historial/')[1]?.split('/')[0];

      if (!clienteId || !/^[0-9a-fA-F]{24}$/.test(clienteId)) {
        res.status(400).json({
          exito: false,
          error: 'ID de cliente inválido',
          mensaje: 'Debe proporcionar un ObjectId válido de MongoDB',
        });
        return;
      }

      const cliente = await Cliente.findById(clienteId)
        .select('nombre apellido saldoActual historicoIntereses')
        .lean();

      if (!cliente) {
        res.status(404).json({ exito: false, error: 'Cliente no encontrado' });
        return;
      }

      res.status(200).json({
        exito: true,
        cliente: {
          nombre: `${cliente.nombre} ${cliente.apellido}`,
          saldoActual: cliente.saldoActual,
        },
        intereses: cliente.historicoIntereses || [],
        cantidad: (cliente.historicoIntereses || []).length,
        montoTotalIntereses: (cliente.historicoIntereses || []).reduce(
          (sum, i) => sum + i.montoAplicado,
          0,
        ),
      });
      return;
    }

    // 404
    res.status(404).json({
      exito: false,
      error: 'Ruta no encontrada',
      rutasDisponibles: [
        'GET /api/intereses',
        'POST /api/intereses/corte',
        'POST /api/intereses/corte/:clienteId',
        'GET /api/intereses/historial/:clienteId',
      ],
    });
  } catch (error) {
    console.error('❌ Error en intereses API:', error);
    res.status(500).json({
      exito: false,
      error: 'Error al procesar solicitud',
      mensaje: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};
