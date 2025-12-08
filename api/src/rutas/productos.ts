import { Router, Request, Response } from "express";
import { verificarAutenticacion } from "../middleware/autenticacion";
import { validar } from "../validacion/validador";
import {
  esquemaCrearProducto,
  esquemaActualizarProducto,
} from "../validacion/schemas";
import { ProductosService } from "../services/ProductosService";
import { Producto } from "../models";

const enrutador = Router();

// Aplicar autenticación a todas las rutas
enrutador.use(verificarAutenticacion);

/**
 * GET /api/productos
 * Obtener todos los productos activos
 */
enrutador.get("/", async (solicitud: Request, respuesta: Response) => {
  try {
    const productos = await ProductosService.obtenerTodos();
    respuesta.json({
      exito: true,
      datos: productos,
      cantidad: productos.length,
      usuario: solicitud.usuario?.email,
    });
  } catch (error) {
    respuesta.status(500).json({
      exito: false,
      error: "Error al obtener productos",
      mensaje: error instanceof Error ? error.message : "Error desconocido",
    });
  }
});

/**
 * GET /api/productos/:id
 * Obtener producto por ID
 */
enrutador.get("/:id", async (solicitud: Request, respuesta: Response) => {
  try {
    const producto = await ProductosService.obtenerPorId(solicitud.params.id);

    if (!producto) {
      respuesta.status(404).json({
        exito: false,
        error: "Producto no encontrado",
      });
      return;
    }

    respuesta.json({
      exito: true,
      dato: producto,
    });
  } catch (error) {
    respuesta.status(500).json({
      exito: false,
      error: "Error al obtener producto",
      mensaje: error instanceof Error ? error.message : "Error desconocido",
    });
  }
});

/**
 * POST /api/productos
 * Crear nuevo producto
 */
enrutador.post(
  "/",
  validar(esquemaCrearProducto),
  async (solicitud: Request, respuesta: Response) => {
    try {
      const nuevoProducto = await ProductosService.crear({
        ...solicitud.body,
        activo: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
      });

      respuesta.status(201).json({
        exito: true,
        mensaje: "Producto creado exitosamente",
        dato: nuevoProducto,
      });
    } catch (error) {
      respuesta.status(400).json({
        exito: false,
        error: "Error al crear producto",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
);

/**
 * PUT /api/productos/:id
 * Actualizar producto
 */
enrutador.put(
  "/:id",
  validar(esquemaActualizarProducto),
  async (solicitud: Request, respuesta: Response) => {
    try {
      const productoActualizado = await ProductosService.actualizar(
        solicitud.params.id,
        {
          ...solicitud.body,
          fechaActualizacion: new Date(),
        }
      );

      if (!productoActualizado) {
        respuesta.status(404).json({
          exito: false,
          error: "Producto no encontrado",
        });
        return;
      }

      respuesta.json({
        exito: true,
        mensaje: "Producto actualizado exitosamente",
        dato: productoActualizado,
      });
    } catch (error) {
      respuesta.status(400).json({
        exito: false,
        error: "Error al actualizar producto",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
);

/**
 * DELETE /api/productos/:id
 * Desactivar producto (soft delete)
 */
enrutador.delete("/:id", async (solicitud: Request, respuesta: Response) => {
  try {
    const productoDesactivado = await Producto.findByIdAndUpdate(
      solicitud.params.id,
      {
        activo: false,
        fechaActualizacion: new Date(),
      },
      { new: true }
    );

    if (!productoDesactivado) {
      respuesta.status(404).json({
        exito: false,
        error: "Producto no encontrado",
      });
      return;
    }

    respuesta.json({
      exito: true,
      mensaje: "Producto desactivado exitosamente",
      dato: productoDesactivado,
    });
  } catch (error) {
    respuesta.status(400).json({
      exito: false,
      error: "Error al desactivar producto",
      mensaje: error instanceof Error ? error.message : "Error desconocido",
    });
  }
});

export default enrutador;
