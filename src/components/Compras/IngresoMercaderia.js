import React, { useState, useEffect } from 'react';

const IngresoMercaderia = () => {
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState({ id: '', codigo: '', nombre: '' });
  const [proveedorSearch, setProveedorSearch] = useState('');
  const [items, setItems] = useState([]);
  const [productoSearchMap, setProductoSearchMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ingresos, setIngresos] = useState([]);
  const [ingresoSearchProveedor, setIngresoSearchProveedor] = useState('');
  const [ingresoDate, setIngresoDate] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/proveedores');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        setProveedores(data);
      } catch (err) {
        console.error(err);
        setError('Error al cargar proveedores');
      }
    };

    const fetchProductos = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/parametros/productos');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        setProductos(data);
      } catch (err) {
        console.error(err);
        setError('Error al cargar productos');
      }
    };

    const fetchIngresos = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/compras');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        setIngresos(data);
      } catch (err) {
        console.error(err);
        setError('Error al cargar ingresos');
      }
    };

    fetchProveedores();
    fetchProductos();
    fetchIngresos();
  }, []);

  const filteredProveedores = proveedorSearch
    ? proveedores.filter(p =>
        `${p.codigo || ''} ${p.nombre || ''}`.toLowerCase().includes(proveedorSearch.toLowerCase())
      )
    : [];

  const filteredProductos = (index) => {
    const searchText = productoSearchMap[index] || '';
    return productos.filter(p =>
      `${p.codigo || ''} ${p.nombre || ''}`.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  const filteredIngresos = ingresos.filter(i => {
    const matchesProveedor = !ingresoSearchProveedor || i.proveedor_nombre.toLowerCase().includes(ingresoSearchProveedor.toLowerCase());
    const matchesFecha = !ingresoDate || new Date(i.fecha).toLocaleDateString('en-CA') === ingresoDate;
    return matchesProveedor && matchesFecha;
  });

  const totalPages = Math.ceil(filteredIngresos.length / itemsPerPage);
  const displayedIngresos = filteredIngresos.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleProveedorSelect = (proveedor) => {
    setProveedorSeleccionado(proveedor);
    setProveedorSearch('');
  };

  const agregarItem = () => {
    const index = items.length;
    setItems([...items, { producto_id: '', producto: null, cantidad: 1, precio: 0, editable: true }]);
    setProductoSearchMap(prev => ({ ...prev, [index]: '' }));
  };

  const handleProductoSelect = (producto, index) => {
    const nuevosItems = [...items];
    nuevosItems[index] = {
      ...nuevosItems[index],
      producto_id: producto.id,
      producto: { ...producto },
      cantidad: 1,
      precio: Number(producto.precio_publico || 0),
      editable: false
    };
    setItems(nuevosItems);
    setProductoSearchMap(prev => ({ ...prev, [index]: '' }));
  };

  const handleProductoSearch = (index) => {
    const productoEncontrado = filteredProductos(index)[0];
    if (productoEncontrado) {
      handleProductoSelect(productoEncontrado, index);
    } else {
      setError(`Producto no encontrado: ${productoSearchMap[index]}`);
    }
  };

  const updateItem = (index, field, value) => {
    const nuevosItems = [...items];
    let numValue = parseFloat(value) || 0;
    if (field === 'cantidad') numValue = Math.max(1, numValue);
    if (field === 'precio') numValue = Math.max(0, numValue);
    nuevosItems[index][field] = numValue;
    setItems(nuevosItems);
  };

  const eliminarItem = (index) => setItems(items.filter((_, i) => i !== index));

  const editarItem = (index) => {
    const nuevosItems = [...items];
    nuevosItems[index].editable = true;
    // Se mantiene el producto pero se reinicia cantidad y precio
    nuevosItems[index].cantidad = 1;
    nuevosItems[index].precio = 0;
    setItems(nuevosItems);
  };

  const calcularSubtotal = (item) => (item.producto && item.precio ? Number(item.cantidad) * Number(item.precio) : 0);
  const calcularTotal = () => items.reduce((total, item) => total + calcularSubtotal(item), 0).toFixed(2);
  const totalIngreso = calcularTotal();

  const handleRegistrar = async () => {
    if (!proveedorSeleccionado.id) {
      setError('Selecciona un proveedor');
      return;
    }
    const validItems = items.filter(item => item.producto_id && item.cantidad > 0 && item.precio > 0);
    if (validItems.length === 0) {
      setError('Agrega al menos un ítem válido con cantidad y precio >0');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const resp = await fetch('http://localhost:5000/api/compras/ingreso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proveedor_id: parseInt(proveedorSeleccionado.id),
          items: validItems.map(item => ({
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            precio: Number(item.precio)
          })),
          total: Number(totalIngreso)
        }),
      });
      const data = await resp.json();
      if (resp.ok) {
        setSuccess(`Ingreso registrado: ${data.numero_factura || 'OK'} - Total: Q ${totalIngreso}`);
        setProveedorSeleccionado({ id: '', codigo: '', nombre: '' });
        setItems([]);
        setProductoSearchMap({});
        const resIngresos = await fetch('http://localhost:5000/api/compras');
        setIngresos(await resIngresos.json());
        setPage(1); // Resetear a primera página
      } else {
        setError(data.message || `Error al registrar ingreso`);
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al registrar ingreso');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (error) setTimeout(() => setError(''), 5000); }, [error]);
  useEffect(() => { if (success) setTimeout(() => setSuccess(''), 5000); }, [success]);

  const renderItemRow = (item, index) => (
    <tr key={index}>
      <td>{index + 1}</td>
      <td>
        {item.editable ? (
          <div className="position-relative">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Buscar producto..."
              value={productoSearchMap[index] || ''}
              onChange={(e) => setProductoSearchMap(prev => ({ ...prev, [index]: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleProductoSearch(index)}
            />
            {productoSearchMap[index] && filteredProductos(index).length > 0 && (
              <ul className="list-group position-absolute w-100" style={{ zIndex: 1050, maxHeight: 200, overflowY: 'auto' }}>
                {filteredProductos(index).slice(0, 5).map(p => (
                  <li
                    key={p.id}
                    className="list-group-item list-group-item-action"
                    onClick={() => handleProductoSelect(p, index)}
                    style={{ cursor: 'pointer' }}
                  >
                    {p.codigo} - {p.nombre}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          item.producto?.nombre || ''
        )}
      </td>
      <td>
        <input
          type="number"
          className="form-control form-control-sm"
          value={item.cantidad}
          min="1"
          onChange={(e) => updateItem(index, 'cantidad', e.target.value)}
        />
      </td>
      <td>
        <input
          type="number"
          className="form-control form-control-sm"
          value={item.precio}
          min="0"
          step="0.01"
          onChange={(e) => updateItem(index, 'precio', e.target.value)}
        />
      </td>
      <td>Q{calcularSubtotal(item).toFixed(2)}</td>
      <td>
        {item.editable ? (
          <button className="btn btn-success btn-sm" onClick={() => handleProductoSearch(index)}>✅</button>
        ) : (
          <button className="btn btn-warning btn-sm" onClick={() => editarItem(index)}>✏️</button>
        )}
        <button className="btn btn-danger btn-sm ms-1" onClick={() => eliminarItem(index)}>🗑</button>
      </td>
    </tr>
  );

  return (
    <div className="container mt-4">
      <h4 className="mb-3 text-center">Ingreso de Mercadería</h4>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card mb-3">
        <div className="card-body">
          <h5>Proveedor</h5>
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Buscar proveedor..."
            value={proveedorSearch}
            onChange={(e) => setProveedorSearch(e.target.value)}
          />
          {filteredProveedores.length > 0 && (
            <ul className="list-group">
              {filteredProveedores.slice(0,5).map(p => (
                <li key={p.id} className="list-group-item list-group-item-action" onClick={() => handleProveedorSelect(p)} style={{ cursor: 'pointer' }}>
                  {p.codigo} - {p.nombre}
                </li>
              ))}
            </ul>
          )}
          {proveedorSeleccionado.id && (
            <div className="mt-2"><strong>Proveedor seleccionado:</strong> {proveedorSeleccionado.nombre}</div>
          )}
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <h5>Productos</h5>
          <table className="table table-sm table-bordered">
            <thead>
              <tr>
                <th>#</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Subtotal</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => renderItemRow(item, index))}
            </tbody>
          </table>
          <button className="btn btn-primary btn-sm" onClick={agregarItem}>Agregar Producto</button>
          <div className="mt-2"><strong>Total:</strong> Q{totalIngreso}</div>
        </div>
      </div>

      <div className="d-grid">
        <button className="btn btn-success" onClick={handleRegistrar} disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar Ingreso'}
        </button>
      </div>

      <div className="card mt-4">
        <div className="card-body">
          <h5>Ingresos Registrados</h5>
          <div className="row mb-2">
            <div className="col">
              <input type="text" className="form-control" placeholder="Buscar proveedor..." value={ingresoSearchProveedor} onChange={(e) => setIngresoSearchProveedor(e.target.value)} />
            </div>
            <div className="col">
              <input type="date" className="form-control" value={ingresoDate} onChange={(e) => setIngresoDate(e.target.value)} />
            </div>
          </div>
          <table className="table table-sm table-bordered">
            <thead>
              <tr>
                <th>#</th>
                <th>Proveedor</th>
                <th>Fecha</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {displayedIngresos.map((ing, i) => (
                <tr key={i}>
                  <td>{(page-1)*itemsPerPage + i + 1}</td>
                  <td>{ing.proveedor_nombre}</td>
                  <td>{new Date(ing.fecha).toLocaleDateString()}</td>
                  <td>Q{Number(ing.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="d-flex justify-content-between">
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(page-1)}>Anterior</button>
            <span>Página {page} de {totalPages}</span>
            <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(page+1)}>Siguiente</button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default IngresoMercaderia;
