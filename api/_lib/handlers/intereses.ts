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
    // ✅ Conectar a MongoDB
    await conectarMongoDB();

    // ✅ Autenticación obligatoria
    let autenticado = false;
    await verificarAutenticacion(req, res, () => {
      autenticado = true;
    });

    if (!autenticado || !req.usuario) {
      return;
    }

    // ✅ Extraer ruta correctamente
    const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);
    const rutaInteres = pathname.replace('/api/intereses', '') || '/';

    console.log('🔍 Debug intereses:', {
      urlCompleta: req.url,
      pathname,
      rutaInteres,
      metodo: req.method,
    });

    // ✅ POST /api/intereses/corte - Ejecutar corte de mes
    if (req.method === 'POST' && rutaInteres.includes('/corte')) {
      const hoy = new Date();

      if (hoy.getDate() < 1) {
        res.status(400).json({
          exito: false,
          error: 'Operación no permitida',
          mensaje:
            'El corte de interés solo puede ejecutarse a partir del día 1 del mes',
        });
        return;
      }

      const clientesConDeuda = await Cliente.find({
        activo: true,
        saldoActual: { $gt: 0 },
      });

      if (clientesConDeuda.length === 0) {
        res.status(400).json({
          exito: false,
          error: 'No hay clientes con deuda',
        });
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

          const montoInteres = cliente.saldoActual * 0.2;
          const nuevoSaldo = cliente.saldoActual + montoInteres;

          cliente.saldoActual = nuevoSaldo;
          cliente.fechaUltimoCorteInteres = hoy;
          cliente.historicoIntereses.push({
            fecha: hoy,
            montoAplicado: montoInteres,
            nuevoSaldo,
            descripcion: `Interés mes ${hoy.toLocaleDateString('es-ES', {
              month: 'long',
              year: 'numeric',
            })}`,
          });

          await cliente.save();

          resultados.procesados++;
          resultados.detalles.push({
            cliente: `${cliente.nombre} ${cliente.apellido}`,
            saldoAnterior: cliente.saldoActual - montoInteres,
            montoInteres,
            nuevoSaldo,
          });
        } catch (error) {
          resultados.errores.push(
            `${cliente.nombre}: ${
              error instanceof Error ? error.message : 'Error desconocido'
            }`
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

    // ✅ GET /api/intereses/historial/[clienteId]
    if (req.method === 'GET' && rutaInteres.includes('/historial/')) {
      const clienteId = rutaInteres.split('/historial/')[1]?.split('/')[0];

      if (!clienteId || !/^[0-9a-fA-F]{24}$/.test(clienteId)) {
        res.status(400).json({
          exito: false,
          error: 'ID de cliente requerido',
        });
        return;
      }

      const cliente = await Cliente.findById(clienteId)
        .select('nombre apellido historicoIntereses')
        .lean();

      if (!cliente) {
        res.status(404).json({
          exito: false,
          error: 'Cliente no encontrado',
        });
        return;
      }

      res.status(200).json({
        exito: true,
        cliente: `${cliente.nombre} ${cliente.apellido}`,
        intereses: cliente.historicoIntereses || [],
        cantidad: (cliente.historicoIntereses || []).length,
      });
      return;
    }

    res.status(405).json({
      exito: false,
      error: 'Método no permitido',
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
