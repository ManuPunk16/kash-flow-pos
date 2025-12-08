import { Router, Request, Response } from "express";
import { verificarAutenticacion } from "../middleware/autenticacion";
import { validar } from "../validacion/validador";
import { esquemaCrearAbono } from "../validacion/schemas";
import { ClientesService } from "../services/ClientesService";
import { AbonoCliente, Cliente } from "../models";

const enrutador = Router();

enrutador.use(verificarAutenticacion);

/**
 * GET /api/abonos
 * Obtener todos los abonos registrados
 */
enrutador.get("/", async (solicitud: Request, respuesta: Response) => {
  try {
    const abonos = await AbonoCliente.find()
      .populate("clienteId")
      .populate("usuarioId")
      .sort({ fechaPago: -1 })
      .lean();

    respuesta.json({
      exito: true,
      datos: abonos,
      cantidad: abonos.length,
    });
  } catch (error) {
    respuesta.status(500).json({
      exito: false,
      error: "Error al obtener abonos",
      mensaje: error instanceof Error ? error.message : "Error desconocido",
    });
  }
});

/**
 * POST /api/abonos
 * Registrar abono a deuda de cliente
 */
enrutador.post(
  "/",
  validar(esquemaCrearAbono),
  async (solicitud: Request, respuesta: Response) => {
    try {
      const { clienteId, monto, metodoPago, referenciaPago, observaciones } =
        solicitud.body;

      // Validar que el cliente exista y tenga saldo
      const cliente = await Cliente.findById(clienteId);

      if (!cliente) {
        respuesta.status(404).json({
          exito: false,
          error: "Cliente no encontrado",
        });
        return;
      }

      if (cliente.saldoActual === 0) {
        respuesta.status(400).json({
          exito: false,
          error: "Cliente sin deuda",
          mensaje: "Este cliente no tiene saldo pendiente",
        });
        return;
      }

      if (monto > cliente.saldoActual) {
        respuesta.status(400).json({
          exito: false,
          error: "Monto mayor que deuda",
          mensaje: `El cliente debe ${cliente.saldoActual}. Monto máximo a abonar: ${cliente.saldoActual}`,
        });
        return;
      }

      // Obtener datos del usuario desde token
      const usuarioId = solicitud.usuario?.uid;
      const usuario = await import("../models").then((m) =>
        m.Usuario.findOne({ firebaseUid: usuarioId })
      );

      if (!usuario) {
        respuesta.status(401).json({
          exito: false,
          error: "Usuario no encontrado",
        });
        return;
      }

      // Calcular nuevo saldo
      const saldoAnterior = cliente.saldoActual;
      const nuevoSaldo = saldoAnterior - monto;

      // Crear registro de abono
      const nuevoAbono = new AbonoCliente({
        clienteId,
        nombreCliente: `${cliente.nombre} ${cliente.apellido}`,
        usuarioId: usuario._id,
        nombreUsuario: `${usuario.nombre} ${usuario.apellido}`,
        monto,
        metodoPago,
        referenciaPago,
        observaciones,
        saldoAnterior,
        nuevoSaldo,
        confirmado: true,
        fechaPago: new Date(),
      });

      await nuevoAbono.save();

      // Actualizar saldo del cliente
      await ClientesService.registrarAbono(clienteId, monto);

      respuesta.status(201).json({
        exito: true,
        mensaje: "Abono registrado exitosamente",
        dato: {
          abono: nuevoAbono,
          saldoAnterior,
          nuevoSaldo,
          clienteInfo: {
            nombre: cliente.nombre,
            apellido: cliente.apellido,
          },
        },
      });
    } catch (error) {
      respuesta.status(400).json({
        exito: false,
        error: "Error al registrar abono",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
);

/**
 * GET /api/abonos/cliente/:clienteId
 * Obtener todos los abonos de un cliente
 */
enrutador.get(
  "/cliente/:clienteId",
  async (solicitud: Request, respuesta: Response) => {
    try {
      const abonos = await AbonoCliente.find({
        clienteId: solicitud.params.clienteId,
      })
        .sort({ fechaPago: -1 })
        .lean();

      respuesta.json({
        exito: true,
        datos: abonos,
        cantidad: abonos.length,
      });
    } catch (error) {
      respuesta.status(500).json({
        exito: false,
        error: "Error al obtener abonos",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
);

export default enrutador;
