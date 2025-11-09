import React, { useState, useEffect } from 'react';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [tiposPago, setTiposPago] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: '',
    codigo: '',
    nombre: '',
    nit: '',
    direccion: '',
    pais: 'Guatemala',
    telefono: '',
    tipo_precio: 'publico',
    tipo_pago_id: '',
    limite_credito: 0,
    activo: true,
  });
  const [modo, setModo] = useState('create');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resClientes, resTipos] = await Promise.all([
          fetch('http://localhost:5000/api/clientes'),
          fetch('http://localhost:5000/api/parametros/tipos-pago')
        ]);
        if (resClientes.ok) setClientes(await resClientes.json());
        if (resTipos.ok) {
          const data = await resTipos.json();
          setTiposPago(data.filter(tp => tp.activo));
        } else {
          console.error('Error cargando tipos pago');
        }
      } catch (err) {
        setError('Error de conexión');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value),
    }));
    if (error) setError('');
  };

  const handleEdit = (cliente) => {
    setFormData({
      id: cliente.id,
      codigo: cliente.codigo || '',
      nombre: cliente.nombre || '',
      nit: cliente.nit || '',
      direccion: cliente.direccion || '',
      pais: cliente.pais || 'Guatemala',
      telefono: cliente.telefono || '',
      tipo_precio: cliente.tipo_precio || 'publico',
      tipo_pago_id: cliente.tipo_pago_id || '',
      limite_credito: parseFloat(cliente.limite_credito) || 0,
      activo: cliente.activo !== false,
    });
    setModo('edit');
    setSuccess('');
    document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancel = () => {
    setFormData({
      id: '',
      codigo: '',
      nombre: '',
      nit: '',
      direccion: '',
      pais: 'Guatemala',
      telefono: '',
      tipo_precio: 'publico',
      tipo_pago_id: '',
      limite_credito: 0,
      activo: true,
    });
    setModo('create');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    if (!formData.codigo.trim() || !formData.nombre.trim() || !formData.tipo_pago_id || !formData.tipo_precio) {
      setError('Código, nombre, tipo de pago y tipo de precio son requeridos');
      setSaving(false);
      return;
    }

    const url = modo === 'edit' ? `http://localhost:5000/api/clientes/${formData.id}` : 'http://localhost:5000/api/clientes';
    const method = modo === 'edit' ? 'PUT' : 'POST';

    try {
      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await resp.json();
      if (resp.ok) {
        setSuccess(modo === 'edit' ? 'Cliente actualizado exitosamente' : 'Cliente creado exitosamente');
        handleCancel();
        const reload = await fetch('http://localhost:5000/api/clientes');
        if (reload.ok) setClientes(await reload.json());
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Error en la operación');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este cliente?')) return;
    try {
      const resp = await fetch(`http://localhost:5000/api/clientes/${id}`, { method: 'DELETE' });
      const data = await resp.json();
      if (resp.ok) {
        setSuccess('Cliente eliminado exitosamente');
        const reload = await fetch('http://localhost:5000/api/clientes');
        if (reload.ok) setClientes(await reload.json());
      } else {
        setError(data.message || 'Error al eliminar');
      }
    } catch (err) {
      setError('Error al eliminar');
      console.error(err);
    }
  };

  const filteredClientes = clientes.filter((c) =>
    `${c.codigo} ${c.nombre} ${c.nit} ${c.pais}`.toLowerCase().includes(search.toLowerCase())
  );

  const formatActivo = (activo) => activo ? 'Sí' : 'No';
  const formatTipoPrecio = (tipo) => tipo === 'publico' ? 'Público' : 'Mayorista';

  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const currentData = filteredClientes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary"></div>
        <p>Cargando clientes...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Gestión de Clientes</h1>

      {error && <div className="alert alert-danger alert-dismissible fade show" role="alert">{error}<button type="button" className="btn-close" onClick={() => setError('')}></button></div>}
      {success && <div className="alert alert-success alert-dismissible fade show" role="alert">{success}<button type="button" className="btn-close" onClick={() => setSuccess('')}></button></div>}

      {/* Formulario */}
      <div id="form-section" className="card mb-4">
        <div className="card-header">
          <h5>{modo === 'edit' ? 'Editar Cliente' : 'Crear Nuevo Cliente'}</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Fila 1 */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Código *</label>
                <input
                  type="text"
                  className="form-control"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleInputChange}
                  required
                  disabled={modo === 'edit'}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Nombre *</label>
                <input
                  type="text"
                  className="form-control"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Fila 2 */}
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">NIT</label>
                <input
                  type="text"
                  className="form-control"
                  name="nit"
                  value={formData.nit}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Dirección</label>
                <input
                  type="text"
                  className="form-control"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">País</label>
                <select
                  className="form-select"
                  name="pais"
                  value={formData.pais || 'Guatemala'}
                  onChange={handleInputChange}
                >
                  <option value="Guatemala">Guatemala</option>
                  <option value="Estados Unidos">Estados Unidos</option>
                </select>
              </div>
            </div>

            {/* Fila 3 */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Teléfono</label>
                <input
                  type="text"
                  className="form-control"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  placeholder="+502 22222222"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Tipo de Precio *</label>
                <select
                  className="form-select"
                  name="tipo_precio"
                  value={formData.tipo_precio}
                  onChange={handleInputChange}
                  required
                >
                  <option value="publico">Público</option>
                  <option value="mayorista">Mayorista</option>
                </select>
              </div>
            </div>

            {/* Fila 4 */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Tipo de Pago *</label>
                <select
                  className="form-select"
                  name="tipo_pago_id"
                  value={formData.tipo_pago_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Selecciona un tipo de pago...</option>
                  {tiposPago.map((tp) => (
                    <option key={tp.id} value={tp.id}>
                      {tp.nombre} - {tp.descripcion}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Límite de Crédito</label>
                <input
                  type="number"
                  className="form-control"
                  name="limite_credito"
                  value={formData.limite_credito}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {modo === 'edit' && (
              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  className="form-check-input"
                  name="activo"
                  id="activo"
                  checked={formData.activo}
                  onChange={handleInputChange}
                />
                <label className="form-check-label" htmlFor="activo">
                  Activo
                </label>
              </div>
            )}

            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Guardando...
                  </>
                ) : modo === 'edit' ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Busqueda */}
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Buscar por código, nombre, NIT o país..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Código</th>
              <th>Nombre</th>
              <th>NIT</th>
              <th>Dirección</th>
              <th>País</th>
              <th>Teléfono</th>
              <th>Tipo Precio</th>
              <th>Tipo Pago</th>
              <th>Límite Crédito</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length > 0 ? (
              currentData.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td><strong>{c.codigo}</strong></td>
                  <td>{c.nombre}</td>
                  <td>{c.nit || '-'}</td>
                  <td>{c.direccion || '-'}</td>
                  <td>{c.pais || '-'}</td>
                  <td>{c.telefono || '-'}</td>
                  <td>
                    <span className={`badge ${c.tipo_precio === 'publico' ? 'bg-info' : 'bg-warning'}`}>
                      {formatTipoPrecio(c.tipo_precio)}
                    </span>
                  </td>
                  <td>{c.tipo_pago_nombre || '-'}</td>
                  <td>Q {(parseFloat(c.limite_credito) || 0).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${c.activo ? 'bg-success' : 'bg-danger'}`}>
                      {formatActivo(c.activo)}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        className="btn btn-warning"
                        onClick={() => handleEdit(c)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(c.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="12" className="text-center py-4">
                  {search ? 'No se encontraron clientes con esa búsqueda.' : 'No hay clientes registrados.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Clientes;
