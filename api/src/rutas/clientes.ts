import { Router, Request, Response } from "express";
import { verificarAutenticacion } from "../middleware/autenticacion";
import { validar } from "../validacion/validador";
import {
  esquemaCrearCliente,
  esquemaActualizarCliente,
} from "../validacion/schemas";
import { ClientesService } from "../services/ClientesService";
import { Cliente } from "../models";

const enrutador = Router();

enrutador.use(verificarAutenticacion);

/**
 * GET /api/clientes
 * Obtener todos los clientes activos
 */
enrutador.get("/", async (solicitud: Request, respuesta: Response) => {
  try {
    const clientes = await ClientesService.obtenerTodos();

    respuesta.json({
      exito: true,
      datos: clientes,
      cantidad: clientes.length,
    });
  } catch (error) {
    respuesta.status(500).json({
      exito: false,
      error: "Error al obtener clientes",
      mensaje: error instanceof Error ? error.message : "Error desconocido",
    });
  }
});

/**
 * GET /api/clientes/deudores
 * Obtener solo clientes con saldo pendiente (ordenados por deuda)
 */
enrutador.get(
  "/deudores/listado",
  async (solicitud: Request, respuesta: Response) => {
    try {
      const deudores = await ClientesService.obtenerDeudores();

      respuesta.json({
        exito: true,
        datos: deudores,
        cantidad: deudores.length,
      });
    } catch (error) {
      respuesta.status(500).json({
        exito: false,
        error: "Error al obtener deudores",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
);

/**
 * GET /api/clientes/:id
 * Obtener cliente por ID
 */
enrutador.get("/:id", async (solicitud: Request, respuesta: Response) => {
  try {
    const cliente = await ClientesService.obtenerPorId(solicitud.params.id);

    if (!cliente) {
      respuesta.status(404).json({
        exito: false,
        error: "Cliente no encontrado",
      });
      return;
    }

    respuesta.json({
      exito: true,
      dato: cliente,
    });
  } catch (error) {
    respuesta.status(500).json({
      exito: false,
      error: "Error al obtener cliente",
      mensaje: error instanceof Error ? error.message : "Error desconocido",
    });
  }
});

/**
 * POST /api/clientes
 * Crear nuevo cliente
 */
enrutador.post(
  "/",
  validar(esquemaCrearCliente),
  async (solicitud: Request, respuesta: Response) => {
    try {
      const nuevoCliente = await ClientesService.crear({
        ...solicitud.body,
        activo: true,
        saldoActual: 0,
        saldoHistorico: 0,
        esMoroso: false,
        diasSinPagar: 0,
        historicoIntereses: [],
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
      });

      respuesta.status(201).json({
        exito: true,
        mensaje: "Cliente creado exitosamente",
        dato: nuevoCliente,
      });
    } catch (error) {
      const mensajeError =
        error instanceof Error ? error.message : "Error desconocido";

      // Validar si es error de duplicado
      if (mensajeError.includes("duplicate")) {
        respuesta.status(409).json({
          exito: false,
          error: "El cliente ya existe",
          mensaje: "La identificación ya está registrada",
        });
        return;
      }

      respuesta.status(400).json({
        exito: false,
        error: "Error al crear cliente",
        mensaje: mensajeError,
      });
    }
  }
);

/**
 * PUT /api/clientes/:id
 * Actualizar datos del cliente
 */
enrutador.put(
  "/:id",
  validar(esquemaActualizarCliente),
  async (solicitud: Request, respuesta: Response) => {
    try {
      const clienteActualizado = await Cliente.findByIdAndUpdate(
        solicitud.params.id,
        {
          ...solicitud.body,
          fechaActualizacion: new Date(),
        },
        { new: true }
      );

      if (!clienteActualizado) {
        respuesta.status(404).json({
          exito: false,
          error: "Cliente no encontrado",
        });
        return;
      }

      respuesta.json({
        exito: true,
        mensaje: "Cliente actualizado exitosamente",
        dato: clienteActualizado,
      });
    } catch (error) {
      respuesta.status(400).json({
        exito: false,
        error: "Error al actualizar cliente",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
);

/**
 * DELETE /api/clientes/:id
 * Desactivar cliente (soft delete)
 */
enrutador.delete("/:id", async (solicitud: Request, respuesta: Response) => {
  try {
    const clienteDesactivado = await Cliente.findByIdAndUpdate(
      solicitud.params.id,
      {
        activo: false,
        fechaActualizacion: new Date(),
      },
      { new: true }
    );

    if (!clienteDesactivado) {
      respuesta.status(404).json({
        exito: false,
        error: "Cliente no encontrado",
      });
      return;
    }

    respuesta.json({
      exito: true,
      mensaje: "Cliente desactivado exitosamente",
      dato: clienteDesactivado,
    });
  } catch (error) {
    respuesta.status(400).json({
      exito: false,
      error: "Error al desactivar cliente",
      mensaje: error instanceof Error ? error.message : "Error desconocido",
    });
  }
});

export default enrutador;
