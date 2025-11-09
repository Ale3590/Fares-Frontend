import React, { useState, useEffect } from 'react';

const Facturacion = () => {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState({ id: '', codigo: '', nombre: '' });
  const [clienteSearch, setClienteSearch] = useState('');
  const [items, setItems] = useState([]);
  const [productoSearch, setProductoSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [facturas, setFacturas] = useState([]);
  const [facturaSearchCliente, setFacturaSearchCliente] = useState('');
  const [facturaDate, setFacturaDate] = useState('');
  const [pagina, setPagina] = useState(1);
  const ITEMS_POR_PAGINA = 15;

  // 🔄 Cargar datos
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/clientes');
        const data = await res.json();
        setClientes(data);
      } catch {
        setError('Error al cargar clientes');
      }
    };

    const fetchProductos = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/parametros/productos');
        const data = await res.json();
        const filtered = data.filter(p => !p.inactivo);
        setProductos(filtered);
      } catch {
        setError('Error al cargar productos');
      }
    };

    const fetchFacturas = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/ventas');
        const data = await res.json();
        setFacturas(data);
      } catch {
        setError('Error al cargar facturas');
      }
    };

    fetchClientes();
    fetchProductos();
    fetchFacturas();
  }, []);

  // 🔍 Filtrar clientes para selección
  const filteredClientes = clientes.filter(c =>
    `${c.codigo || ''} ${c.nombre || ''}`.toLowerCase().includes(clienteSearch.toLowerCase())
  );

  const handleClienteSelect = (cliente) => {
    setClienteSeleccionado(cliente);
    setClienteSearch('');
  };

  // ➕ Agregar item
  const agregarItem = () => {
    setItems([...items, { producto_id: '', producto: null, descuento: 0, cantidad: 1, editable: true }]);
    setProductoSearch('');
  };

  // 🔎 Filtrar productos para autocompletado
  const filteredProductos = productos.filter(p =>
    `${p.codigo} ${p.nombre} ${p.categoria}`.toLowerCase().includes(productoSearch.toLowerCase())
  );

  const handleProductoSelect = (producto, index) => {
    const nuevosItems = [...items];
    nuevosItems[index] = {
      ...nuevosItems[index],
      producto_id: producto.id,
      producto: {
        ...producto,
        precio_publico: Number(producto.precio_publico),
        stock: Number(producto.stock || 0),
        existencia_minima: Number(producto.existencia_minima || 0)
      },
      editable: false
    };
    setItems(nuevosItems);
    setProductoSearch('');
  };

  // ✏️ Actualizar item
  const updateItem = (index, field, value) => {
    const nuevosItems = [...items];
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
    setItems(nuevosItems);
  };

  // 🗑 Eliminar item
  //const eliminarItem = (index) => {
    //setItems(items.filter((_, i) => i !== index));
  //};

  // ✏️ Habilitar edición
  const editarItem = (index) => {
    const nuevosItems = [...items];
    nuevosItems[index].editable = true;
    nuevosItems[index].producto = null;
    nuevosItems[index].producto_id = '';
    setItems(nuevosItems);
  };

  // 💰 Calcular subtotal y total
  const calcularSubtotal = (item) => item.producto ? (item.cantidad * item.producto.precio_publico * (1 - (item.descuento || 0)/100)) : 0;
  const calcularTotal = () => items.reduce((total, item) => total + calcularSubtotal(item), 0).toFixed(2);
  const totalVenta = calcularTotal();

  // 📤 Aplicar venta
  const handleAplicar = async () => {
    if (!clienteSeleccionado.id) { setError('Selecciona un cliente'); return; }
    const validItems = items.filter(item => item.producto_id && item.cantidad > 0);
    if (validItems.length === 0) { setError('Agrega al menos un producto válido'); return; }

    setLoading(true);
    setError('');
    try {
      const resp = await fetch('http://localhost:5000/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: parseInt(clienteSeleccionado.id),
          items: validItems.map(item => ({
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            descuento: item.descuento,
            precio: item.producto.precio_publico
          })),
          total: Number(totalVenta)
        }),
      });
      const data = await resp.json();
      if (resp.ok) {
        setSuccess(`Venta creada: ${data.numero_venta || 'OK'} - Total: Q ${totalVenta}`);
        setClienteSeleccionado({ id: '', codigo: '', nombre: '' });
        setItems([]);
        setTimeout(() => setSuccess(''), 5000);
        const resFacturas = await fetch('http://localhost:5000/api/ventas');
        setFacturas(await resFacturas.json());
      } else {
        setError(data.message || `Error al crear venta: ${JSON.stringify(data)}`);
      }
    } catch {
      setError('Error de conexión al aplicar venta');
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Filtrar facturas
  const filteredFacturas = facturas.filter(f => {
    const matchesCliente = !facturaSearchCliente || f.cliente_nombre.toLowerCase().includes(facturaSearchCliente.toLowerCase());
    const matchesFecha = !facturaDate || new Date(f.fecha).toISOString().split('T')[0] === facturaDate;
    return matchesCliente && matchesFecha;
  });

  // 📄 Paginación
  const totalPaginas = Math.ceil(filteredFacturas.length / ITEMS_POR_PAGINA);
  const facturasMostradas = filteredFacturas.slice((pagina - 1) * ITEMS_POR_PAGINA, pagina * ITEMS_POR_PAGINA);

  // 🖼 Render fila
  const renderItemRow = (item, index) => (
    <tr key={index}>
      <td>
        {item.editable ? (
          <>
            <input type="text" className="form-control form-control-sm" placeholder="Buscar producto..."
              value={productoSearch}
              onChange={(e) => setProductoSearch(e.target.value)}
            />
            {productoSearch && filteredProductos.length > 0 && (
              <ul className="list-group position-absolute" style={{ zIndex: 999 }}>
                {filteredProductos.slice(0,5).map(p => (
                  <li key={p.id} className="list-group-item list-group-item-action"
                    onClick={() => handleProductoSelect(p, index)}>
                    {p.codigo} - {p.nombre} ({p.categoria})
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          `${item.producto.codigo} - ${item.producto.nombre}`
        )}
      </td>
      <td>{item.producto ? item.producto.categoria : '-'}</td>
      <td>{item.producto ? item.producto.stock : '-'}</td>
      <td className="text-end">{item.producto ? Number(item.producto.precio_publico).toFixed(2) : '-'}</td>
      <td>
        <input type="number" className="form-control form-control-sm" min="0" max="100"
          value={item.descuento || 0} onChange={(e) => updateItem(index, 'descuento', e.target.value)} disabled={!item.producto} />
      </td>
      <td className="text-end">{item.producto ? Number(item.producto.precio_publico * (1 - (item.descuento || 0)/100)).toFixed(2) : '-'}</td>
      <td>
        <input type="number" className="form-control form-control-sm" min="1" max={item.producto ? item.producto.stock : ''}
          value={item.cantidad || 1} onChange={(e) => updateItem(index, 'cantidad', e.target.value)} disabled={!item.producto} />
      </td>
      <td className="text-end fw-bold">Q {calcularSubtotal(item).toFixed(2)}</td>
      <td>
        <button className="btn btn-sm btn-outline-primary" onClick={() => editarItem(index)}>Editar</button>
      </td>
    </tr>
  );

  return (
    <div className="container-fluid mt-4">
      <h1 className="text-center mb-4">Facturación</h1>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Cliente */}
      <div className="row mb-4">
        <div className="col-md-6">
          <label className="form-label fw-bold">Seleccionar Cliente</label>
          <input type="text" className="form-control" placeholder="Buscar cliente por código o nombre..."
            value={clienteSearch} onChange={(e) => setClienteSearch(e.target.value)} />
          {clienteSearch && filteredClientes.length > 0 && (
            <ul className="list-group mt-2">
              {filteredClientes.slice(0,5).map(c => (
                <li key={c.id} className="list-group-item list-group-item-action" onClick={() => handleClienteSelect(c)}>
                  {c.codigo} - {c.nombre}
                </li>
              ))}
            </ul>
          )}
          {clienteSeleccionado.id && <div className="mt-2 alert alert-info">Cliente seleccionado: {clienteSeleccionado.nombre}</div>}
        </div>
      </div>

      {/* Items */}
      <div className="mb-3"><button className="btn btn-primary" onClick={agregarItem}>Agregar Ítem</button></div>
      <table className="table table-sm table-bordered">
        <thead>
          <tr>
            <th>Producto</th><th>Descripción</th><th>Stock</th><th>Precio</th>
            <th>% Desc</th><th>Precio Desc</th><th>Cantidad</th><th>Subtotal</th><th>Acción</th>
          </tr>
        </thead>
        <tbody>{items.map(renderItemRow)}</tbody>
      </table>

      <div className="text-end fw-bold fs-5 mb-3">Total: Q {totalVenta}</div>
      <div className="d-flex justify-content-end">
        <button className="btn btn-success" onClick={handleAplicar} disabled={loading}>{loading ? 'Procesando...' : 'Aplicar Venta'}</button>
      </div>

      {/* Facturas */}
      <div className="mt-5">
        <h3 style={{color:'black'}}>Facturas Registradas</h3>
        <div className="row mb-3">
          <div className="col-md-6">
            <input type="text" className="form-control" placeholder="Buscar por cliente..." 
              value={facturaSearchCliente} onChange={(e) => setFacturaSearchCliente(e.target.value)} />
          </div>
          <div className="col-md-3">
            <input type="date" className="form-control" value={facturaDate} onChange={(e) => setFacturaDate(e.target.value)} />
          </div>
        </div>

        <table className="table table-striped table-hover">
          <thead className="table-dark">
            <tr>
              <th>No. Venta</th><th>Cliente</th><th>Total</th><th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {facturasMostradas.length > 0 ? facturasMostradas.map(f => (
              <tr key={f.id}>
                <td>{f.numero_venta}</td>
                <td>{f.cliente_nombre}</td>
                <td>Q {f.total}</td>
                <td>{new Date(f.fecha).toLocaleDateString()}</td>
              </tr>
            )) : (
              <tr><td colSpan="4" className="text-center">No hay facturas registradas</td></tr>
            )}
          </tbody>
        </table>

        {/* Paginación */}
        <div className="d-flex justify-content-center mt-2">
          <button className="btn btn-sm btn-outline-primary me-2" 
                  onClick={() => setPagina(p => Math.max(1, p-1))}
                  disabled={pagina === 1}>
            Anterior
          </button>
          <span className="align-self-center mx-2">Página {pagina} de {totalPaginas}</span>
          <button className="btn btn-sm btn-outline-primary ms-2" 
                  onClick={() => setPagina(p => Math.min(totalPaginas, p+1))}
                  disabled={pagina === totalPaginas}>
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};

export default Facturacion;
