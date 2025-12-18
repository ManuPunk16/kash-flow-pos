import { Producto, type IProducto } from '../models/index.js';

export class ProductosService {
  /**
   * Obtener todos los productos activos
   */
  static async obtenerTodos(): Promise<IProducto[]> {
    return await Producto.find({ activo: true })
      .select('-__v')
      .lean()
      .maxTimeMS(5000);
  }

  /**
   * Obtener producto por ID
   */
  static async obtenerPorId(id: string): Promise<IProducto | null> {
    return await Producto.findById(id).select('-__v').lean().maxTimeMS(3000);
  }

  /**
   * Crear nuevo producto
   */
  static async crear(datos: Partial<IProducto>): Promise<IProducto> {
    const producto = new Producto(datos);
    return await producto.save();
  }

  /**
   * Actualizar producto
   */
  static async actualizar(
    id: string,
    datos: Partial<IProducto>
  ): Promise<IProducto | null> {
    return await Producto.findByIdAndUpdate(id, datos, {
      new: true,
      runValidators: true,
    }).maxTimeMS(3000);
  }

  /**
   * Validar stock antes de venta
   */
  static async validarStock(id: string, cantidad: number): Promise<boolean> {
    const producto = await Producto.findById(id)
      .select('stock')
      .lean()
      .maxTimeMS(3000);
    return producto ? producto.stock >= cantidad : false;
  }

  /**
   * Descontar stock después de venta
   */
  static async descontarStock(id: string, cantidad: number): Promise<void> {
    await Producto.findByIdAndUpdate(id, {
      $inc: { stock: -cantidad },
    }).maxTimeMS(3000);
  }
}
