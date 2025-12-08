import { Router, Request, Response } from "express";
import { verificarAutenticacion } from "../middleware/autenticacion";
import { validar } from "../validacion/validador";
import { esquemaCrearVenta } from "../validacion/schemas";
import { VentasService } from "../services/VentasService";
import { Venta } from "../models";
import { v4 as uuid } from "uuid";

const enrutador = Router();

/**
 * GET /api/ventas/cliente/:clienteId
 * Obtener ventas de un cliente específico
 */
enrutador.get(
  "/cliente/:clienteId",
  async (solicitud: Request, respuesta: Response) => {
    try {
      const ventas = await VentasService.obtenerPorCliente(
        solicitud.params.clienteId
      );

      respuesta.json({
        exito: true,
        datos: ventas,
        cantidad: ventas.length,
      });
    } catch (error) {
      respuesta.status(500).json({
        exito: false,
        error: "Error al obtener ventas",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
);

enrutador.use(verificarAutenticacion);

/**
 * GET /api/ventas
 * Obtener todas las ventas
 */
enrutador.get("/", async (solicitud: Request, respuesta: Response) => {
  try {
    const ventas = await VentasService.obtenerTodas();

    respuesta.json({
      exito: true,
      datos: ventas,
      cantidad: ventas.length,
    });
  } catch (error) {
    respuesta.status(500).json({
      exito: false,
      error: "Error al obtener ventas",
      mensaje: error instanceof Error ? error.message : "Error desconocido",
    });
  }
});

/**
 * GET /api/ventas/:id
 * Obtener venta por ID
 */
enrutador.get("/:id", async (solicitud: Request, respuesta: Response) => {
  try {
    const venta = await Venta.findById(solicitud.params.id)
      .populate("clienteId")
      .populate("usuarioId")
      .populate("items.productoId");

    if (!venta) {
      respuesta.status(404).json({
        exito: false,
        error: "Venta no encontrada",
      });
      return;
    }

    respuesta.json({
      exito: true,
      dato: venta,
    });
  } catch (error) {
    respuesta.status(500).json({
      exito: false,
      error: "Error al obtener venta",
      mensaje: error instanceof Error ? error.message : "Error desconocido",
    });
  }
});

/**
 * POST /api/ventas
 * Crear nueva venta (flujo completo)
 */
enrutador.post(
  "/",
  validar(esquemaCrearVenta),
  async (solicitud: Request, respuesta: Response) => {
    try {
      const {
        clienteId,
        usuarioId,
        items,
        descuento = 0,
        metodoPago,
        referenciaPago,
        observaciones,
      } = solicitud.body;

      // Validar que haya al menos un item
      if (!items || items.length === 0) {
        respuesta.status(400).json({
          exito: false,
          error: "Validación fallida",
          mensaje: "La venta debe contener al menos un producto",
        });
        return;
      }

      // Calcular totales y ganancias
      let subtotal = 0;
      let gananciaTotal = 0;

      const itemsProcesados = items.map(
        (item: {
          productoId: string;
          cantidad: number;
          precioUnitario: number;
          costoUnitario: number;
        }) => {
          const cantidad = item.cantidad;
          const precioUnitario = item.precioUnitario;
          const costoUnitario = item.costoUnitario;

          const subtotalItem = cantidad * precioUnitario;
          const gananciaItem = (precioUnitario - costoUnitario) * cantidad;

          subtotal += subtotalItem;
          gananciaTotal += gananciaItem;

          return {
            productoId: item.productoId,
            nombreProducto: "", // Se llena en BD
            cantidad,
            precioUnitario,
            costoUnitario,
            subtotal: subtotalItem,
            ganancia: gananciaItem,
            esConsignacion: false,
          };
        }
      );

      const total = subtotal - descuento;

      // Obtener datos del cliente y usuario para nombres
      const { Cliente, Usuario } = await import("../models");
      const cliente = await Cliente.findById(clienteId);
      const usuario = await Usuario.findById(usuarioId);

      if (!cliente || !usuario) {
        respuesta.status(404).json({
          exito: false,
          error: "Cliente o usuario no encontrado",
        });
        return;
      }

      // Crear objeto de venta
      const datosVenta = {
        numeroVenta: `VTA-${new Date().toISOString().split("T")[0]}-${uuid()
          .substring(0, 8)
          .toUpperCase()}`,
        clienteId,
        nombreCliente: `${cliente.nombre} ${cliente.apellido}`,
        usuarioId,
        nombreUsuario: `${usuario.nombre} ${usuario.apellido}`,
        items: itemsProcesados,
        subtotal,
        descuento,
        total,
        metodoPago,
        referenciaPago,
        gananciaTotal,
        observaciones,
        estado: "completada" as const,
        fechaVenta: new Date(),
      };

      // Usar servicio para crear venta (maneja transaccionalidad)
      const ventaCreada = await VentasService.crear(datosVenta);

      respuesta.status(201).json({
        exito: true,
        mensaje: "Venta registrada exitosamente",
        dato: ventaCreada,
      });
    } catch (error) {
      respuesta.status(400).json({
        exito: false,
        error: "Error al crear venta",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
);

/**
 * PUT /api/ventas/:id
 * Anular venta (soft delete - cambiar estado a 'anulada')
 */
enrutador.put("/:id", async (solicitud: Request, respuesta: Response) => {
  try {
    // Solo permitir cambiar estado a anulada
    const { estado } = solicitud.body;

    if (estado !== "anulada") {
      respuesta.status(400).json({
        exito: false,
        error: "Operación no permitida",
        mensaje:
          'Solo se puede cambiar el estado a "anulada". Para editar, cree una nueva venta',
      });
      return;
    }

    const venta = await Venta.findById(solicitud.params.id);

    if (!venta) {
      respuesta.status(404).json({
        exito: false,
        error: "Venta no encontrada",
      });
      return;
    }

    if (venta.estado === "anulada") {
      respuesta.status(400).json({
        exito: false,
        error: "Venta ya anulada",
      });
      return;
    }

    // Actualizar estado a anulada
    venta.estado = "anulada";
    await venta.save();

    respuesta.json({
      exito: true,
      mensaje: "Venta anulada exitosamente",
      dato: venta,
    });
  } catch (error) {
    respuesta.status(400).json({
      exito: false,
      error: "Error al anular venta",
      mensaje: error instanceof Error ? error.message : "Error desconocido",
    });
  }
});

export default enrutador;
