import React, { useState, useEffect } from "react";

const POS = () => {
  const [clienteNIT, setClienteNIT] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [total, setTotal] = useState(0);
  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]); // 🔹 Lista de clientes
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [productoSearch, setProductoSearch] = useState("");

  // 🔹 Cargar productos
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/parametros/productos");
        const data = await res.json();
        const activos = data.filter(p => !p.inactivo);
        setProductos(activos);
      } catch (err) {
        console.error(err);
        setError("Error al cargar productos");
      }
    };
    fetchProductos();
  }, []);

  // 🔹 Cargar ventas
  useEffect(() => {
    const fetchVentas = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/ventas");
        const data = await res.json();
        setVentas(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchVentas();
  }, []);

  // 🔹 Cargar clientes
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/clientes");
        const data = await res.json();
        setClientes(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchClientes();
  }, []);

  // 🔹 Actualizar total
  useEffect(() => {
    const newTotal = carrito.reduce(
      (sum, item) => sum + (item.producto ? item.cantidad * item.producto.precio_publico * (1 - (item.descuento || 0)/100) : 0),
      0
    );
    setTotal(newTotal);
  }, [carrito]);

  // 🔹 Agregar ítem vacío
  const agregarItem = () => {
    setCarrito([...carrito, { producto_id: '', producto: null, cantidad: 1, descuento: 0, editable: true }]);
    setProductoSearch('');
  };

  // 🔹 Seleccionar producto
  const handleProductoSelect = (producto, index) => {
    const nuevosItems = [...carrito];
    nuevosItems[index] = {
      ...nuevosItems[index],
      producto_id: producto.id,
      producto: {
        ...producto,
        precio_publico: Number(producto.precio_publico),
        stock: Number(producto.stock || 0)
      },
      editable: false
    };
    setCarrito(nuevosItems);
    setProductoSearch('');
  };

  // 🔹 Actualizar item
  const updateItem = (index, field, value) => {
    const nuevosItems = [...carrito];
    let numValue = parseFloat(value) || (field === 'cantidad' ? 1 : 0);

    if (field === 'descuento') {
      numValue = Math.max(0, Math.min(100, numValue));
    } else if (field === 'cantidad') {
      if (nuevosItems[index].producto && numValue > nuevosItems[index].producto.stock) {
        numValue = nuevosItems[index].producto.stock;
        setError(`Cantidad máxima: ${numValue}`);
      }
    }

    nuevosItems[index][field] = numValue;
    setCarrito(nuevosItems);
  };

  // 🔹 Editar item
  const editarItem = (index) => {
    const nuevosItems = [...carrito];
    nuevosItems[index].editable = true;
    nuevosItems[index].producto = null;
    nuevosItems[index].producto_id = '';
    setCarrito(nuevosItems);
  };

  // 🔹 Subtotal por item
  const calcularSubtotal = (item) => item.producto ? (item.cantidad * item.producto.precio_publico * (1 - (item.descuento || 0)/100)) : 0;

  // 🔹 Buscar o crear cliente
  const buscarOCrearCliente = async (nit, nombre) => {
    try {
      // Buscar cliente por NIT
      const resBuscar = await fetch(`http://localhost:5000/api/clientes?nit=${nit}`);
      const clientesEncontrados = await resBuscar.json();
      if (clientesEncontrados.length > 0) {
        return clientesEncontrados[0]; // Devuelve objeto completo
      }

      // Si no existe, crearlo
      const resCrear = await fetch("http://localhost:5000/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nit, nombre }),
      });
      const nuevoCliente = await resCrear.json();
      return nuevoCliente; // Devuelve objeto completo
    } catch (err) {
      console.error("Error al buscar/crear cliente:", err);
      throw new Error("Error al procesar cliente");
    }
  };

  // 🔹 Registrar venta
  const registrarVenta = async () => {
    if (!clienteNombre) { setError('Ingresa NIT y nombre del cliente'); return; }

    const validItems = carrito.filter(item => item.producto_id && item.cantidad > 0);
    if (validItems.length === 0) { setError('Agrega al menos un producto válido'); return; }

    setLoading(true);
    setError('');
    try {
      // Buscar o crear cliente
      const clienteObj = await buscarOCrearCliente(clienteNIT || "C/F", clienteNombre);

      // 🔹 Actualizar lista de clientes si es nuevo
      const existeCliente = clientes.find(c => c.id === clienteObj.id);
      if (!existeCliente) {
        setClientes(prev => [...prev, clienteObj]);
      }

      // Registrar venta
      const resp = await fetch("http://localhost:5000/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: clienteObj.id,
          items: validItems.map(item => ({
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            descuento: item.descuento,
            precio: item.producto.precio_publico
          })),
          total: Number(total.toFixed(2))
        }),
      });

      const data = await resp.json();
      if (resp.ok) {
        setSuccess(`Venta registrada: ${data.numero_venta || 'OK'} - Q ${total.toFixed(2)}`);
        setClienteNIT('');
        setClienteNombre('');
        setCarrito([]);
        setTotal(0);

        // Recargar ventas
        const resVentas = await fetch("http://localhost:5000/api/ventas");
        setVentas(await resVentas.json());

        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.message || `Error al registrar venta: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      console.error(err);
      setError('Error al registrar venta');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Filtrar productos
  const filteredProductos = productos.filter(p =>
    `${p.codigo} ${p.nombre} ${p.categoria}`.toLowerCase().includes(productoSearch.toLowerCase())
  );

  // 🔹 Render item fila
  const renderItemRow = (item, index) => (
    <tr key={index}>
      <td>
        {item.editable ? (
          <>
            <input type="text" className="form-control form-control-sm" placeholder="Buscar producto..."
              value={productoSearch} onChange={(e) => setProductoSearch(e.target.value)} />
            {productoSearch && filteredProductos.length > 0 && (
              <ul className="list-group position-absolute" style={{ zIndex: 999 }}>
                {filteredProductos.slice(0,5).map(p => (
                  <li key={p.id} className="list-group-item list-group-item-action" onClick={() => handleProductoSelect(p, index)}>
                    {p.codigo} - {p.nombre} ({p.categoria}) - Q{p.precio_publico}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          `${item.producto.codigo} - ${item.producto.nombre}`
        )}
      </td>
      <td>
        <input type="number" className="form-control form-control-sm" min="1"
          value={item.cantidad} onChange={(e) => updateItem(index, 'cantidad', e.target.value)} disabled={!item.producto} />
      </td>
      <td>
        <input type="number" className="form-control form-control-sm" min="0" max="100"
          value={item.descuento} onChange={(e) => updateItem(index, 'descuento', e.target.value)} disabled={!item.producto} />
      </td>
      <td className="text-end fw-bold">Q {calcularSubtotal(item).toFixed(2)}</td>
      <td>
        <button className="btn btn-sm btn-outline-primary" onClick={() => editarItem(index)}>Editar</button>
      </td>
    </tr>
  );

  return (
    <div className="container-fluid mt-4">
      <h2 className="text-center mb-4">Punto de Venta (POS)</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Cliente */}
      <div className="row mb-3">
        <div className="col-md-3">
          <input type="text" className="form-control" placeholder="NIT del Cliente" value={clienteNIT} onChange={(e) => setClienteNIT(e.target.value)} />
        </div>
        <div className="col-md-5">
          <input type="text" className="form-control" placeholder="Nombre del Cliente" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} />
        </div>
      </div>

      {/* Carrito */}
      <div className="mb-3"><button className="btn btn-primary" onClick={agregarItem}>Agregar Producto</button></div>
      <table className="table table-sm table-bordered">
        <thead>
          <tr>
            <th>Producto</th><th>Cantidad</th><th>% Desc</th><th>Subtotal</th><th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {carrito.map(renderItemRow)}
        </tbody>
      </table>

      <div className="text-end fw-bold fs-5 mb-3">Total: Q {total.toFixed(2)}</div>
      <div className="d-flex justify-content-end mb-4">
        <button className="btn btn-success" onClick={registrarVenta} disabled={loading}>{loading ? 'Procesando...' : 'Registrar Venta'}</button>
      </div>

      {/* Ventas registradas */}
      <h3>Ventas Registradas</h3>
      <table className="table table-striped table-hover">
        <thead className="table-dark">
          <tr>
            <th>No. Venta</th><th>Cliente</th><th>Total</th><th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {ventas.length > 0 ? ventas.map(v => (
            <tr key={v.id}>
              <td>{v.numero_venta}</td>
              <td>{v.cliente_nombre}</td>
              <td>Q{v.total}</td>
              <td>{new Date(v.fecha).toLocaleDateString()}</td>
            </tr>
          )) : (
            <tr><td colSpan="4" className="text-center">No hay ventas registradas</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default POS;
