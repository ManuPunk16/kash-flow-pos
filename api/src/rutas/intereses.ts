import { Router, Request, Response } from "express";
import { verificarAutenticacion } from "../middleware/autenticacion";
import { ClientesService } from "../services/ClientesService";
import { Cliente } from "../models";

const enrutador = Router();

enrutador.use(verificarAutenticacion);

/**
 * POST /api/intereses/ejecutar-corte
 * Ejecutar corte de mes (aplicar 20% de interés a todos los deudores)
 * Solo puede ejecutarse una vez por mes
 */
enrutador.post("/corte", async (solicitud: Request, respuesta: Response) => {
  try {
    const hoy = new Date();

    // Validar que sea día 1 del mes (o posterior sin que se haya ejecutado)
    if (hoy.getDate() < 1) {
      respuesta.status(400).json({
        exito: false,
        error: "Operación no permitida",
        mensaje:
          "El corte de interés solo puede ejecutarse a partir del día 1 del mes",
      });
      return;
    }

    // Obtener todos los clientes con deuda
    const clientesConDeuda = await Cliente.find({
      activo: true,
      saldoActual: { $gt: 0 },
    });

    if (clientesConDeuda.length === 0) {
      respuesta.status(400).json({
        exito: false,
        error: "No hay clientes con deuda",
      });
      return;
    }

    // Procesar cada cliente
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
        // Validar si ya se aplicó interés este mes
        if (
          cliente.fechaUltimoCorteInteres &&
          cliente.fechaUltimoCorteInteres.getMonth() === hoy.getMonth() &&
          cliente.fechaUltimoCorteInteres.getFullYear() === hoy.getFullYear()
        ) {
          resultados.yaConInteresAplicado++;
          continue;
        }

        // Aplicar 20% de interés
        const montoInteres = cliente.saldoActual * 0.2;
        const nuevoSaldo = cliente.saldoActual + montoInteres;

        // Actualizar cliente
        cliente.saldoActual = nuevoSaldo;
        cliente.fechaUltimoCorteInteres = hoy;
        cliente.historicoIntereses.push({
          fecha: hoy,
          montoAplicado: montoInteres,
          nuevoSaldo,
          descripcion: `Interés mes ${hoy.toLocaleDateString("es-ES")}`,
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
            error instanceof Error ? error.message : "Error desconocido"
          }`
        );
      }
    }

    respuesta.json({
      exito: true,
      mensaje: "Corte de mes ejecutado",
      resumen: {
        clientesProcesados: resultados.procesados,
        clientesYaConInteres: resultados.yaConInteresAplicado,
        errores: resultados.errores.length,
      },
      detalles: resultados.detalles,
      errores: resultados.errores,
    });
  } catch (error) {
    respuesta.status(500).json({
      exito: false,
      error: "Error al ejecutar corte",
      mensaje: error instanceof Error ? error.message : "Error desconocido",
    });
  }
});

/**
 * GET /api/intereses/historial/:clienteId
 * Ver historial de intereses aplicados a un cliente
 */
enrutador.get(
  "/historial/:clienteId",
  async (solicitud: Request, respuesta: Response) => {
    try {
      const cliente = await Cliente.findById(solicitud.params.clienteId)
        .select("nombre apellido historicoIntereses")
        .lean();

      if (!cliente) {
        respuesta.status(404).json({
          exito: false,
          error: "Cliente no encontrado",
        });
        return;
      }

      respuesta.json({
        exito: true,
        cliente: `${cliente.nombre} ${cliente.apellido}`,
        intereses: cliente.historicoIntereses || [],
        cantidad: (cliente.historicoIntereses || []).length,
      });
    } catch (error) {
      respuesta.status(500).json({
        exito: false,
        error: "Error al obtener historial",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
);

export default enrutador;
