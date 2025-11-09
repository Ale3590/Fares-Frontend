import React, { useState, useEffect } from 'react';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [tiposPago, setTiposPago] = useState([]);  // Para select de tipo_pago
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: '',
    codigo: '',
    nombre: '',
    nit: '',
    direccion: '',
    telefono: '',
    tipo_precio: 'publico',  // Default
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

  // Cargar clientes y tipos_pago
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
          setTiposPago(data.filter(tp => tp.activo));  // Solo tipos activos
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
      telefono: cliente.telefono || '',
      tipo_precio: cliente.tipo_precio || 'publico',
      tipo_pago_id: cliente.tipo_pago_id || '',
      limite_credito: cliente.limite_credito || 0,
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

    // Validaciones frontend
    if (!formData.codigo.trim() || !formData.nombre.trim() || !formData.tipo_pago_id || !formData.tipo_precio) {
      setError('Código, nombre, tipo de pago y tipo de precio son requeridos');
      setSaving(false);
      return;
    }

    const url = modo === 'edit'
      ? `http://localhost:5000/api/clientes/${formData.id}`
      : 'http://localhost:5000/api/clientes';
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
    `${c.codigo} ${c.nombre} ${c.nit}`.toLowerCase().includes(search.toLowerCase())
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
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h1 className="text-center">Gestión de Clientes</h1>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Formulario - ID: form-section para scroll en edit */}
      <div id="form-section" className="card mb-4">
        <div className="card-header">
          {modo === 'edit' ? 'Editar Cliente' : 'Crear Cliente'}
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Fila 1: Código y Nombre (requeridos) */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label>Código *</label>
                <input
                  type="text"
                  className="form-control"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., CLI-001"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label>Nombre *</label>
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

            {/* Fila 2: NIT y Dirección */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label>NIT</label>
                <input
                  type="text"
                  className="form-control"
                  name="nit"
                  value={formData.nit}
                  onChange={handleInputChange}
                  placeholder="e.g., 123456789-1"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label>Dirección</label>
                <input
                  type="text"
                  className="form-control"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  placeholder="e.g., Calle 123 #45-67, Bogotá"
                />
              </div>
            </div>

            {/* Fila 3: Teléfono y Tipo de Precio (select) */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label>Teléfono</label>
                <input
                  type="text"
                  className="form-control"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  placeholder="e.g., +57 300 1234567"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label>Tipo de Precio *</label>
                <select
                  className="form-control"
                  name="tipo_precio"
                  value={formData.tipo_precio}
                  onChange={handleInputChange}
                  required
                >
                  <option value="publico">Público (precio normal del producto)</option>
                  <option value="mayorista">Mayorista (precio especial del producto)</option>
                </select>
              </div>
            </div>

            {/* Fila 4: Tipo de Pago (select de BD) y Límite Crédito */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label>Tipo de Pago *</label>
                <select
                  className="form-control"
                  name="tipo_pago_id"
                  value={formData.tipo_pago_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Selecciona un tipo...</option>
                  {tiposPago.map((tp) => (
                    <option key={tp.id} value={tp.id}>
                      {tp.nombre} - {tp.descripcion}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label>Límite de Crédito (para crédito)</label>
                <input
                  type="number"
                  className="form-control"
                  name="limite_credito"
                  value={formData.limite_credito}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Checkbox Activo (solo en edit, como en marcas) */}
            {modo === 'edit' && (
              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  className="form-check-input"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleInputChange}
                />
                <label className="form-check-label">Activo</label>
              </div>
            )}

            {/* Botones */}
            <div className="text-end">
              <button
                type="button"
                className="btn btn-secondary me-2"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : modo === 'edit' ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Buscar */}
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Buscar por código, nombre o NIT..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Tabla */}
      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Código</th>
              <th>Nombre</th>
              <th>NIT</th>
              <th>Dirección</th>
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
                  <td>{c.codigo}</td>
                  <td>{c.nombre}</td>
                  <td>{c.nit || '-'}</td>
                  <td>{c.direccion || '-'}</td>
                  <td>{c.telefono || '-'}</td>
                  <td>
                    <span className={`badge ${c.tipo_precio === 'publico' ? 'bg-info' : 'bg-warning'}`}>
                      {formatTipoPrecio(c.tipo_precio)}
                    </span>
                  </td>
                  <td>{c.tipo_pago_nombre || '-'}</td>
                  <td>${c.limite_credito?.toFixed(2) || '0.00'}</td>
                  <td>
                    <span className={`badge ${c.activo ? 'bg-success' : 'bg-danger'}`}>
                      {formatActivo(c.activo)}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-warning me-2"
                      onClick={() => handleEdit(c)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(c.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" className="text-center">
                  No se encontraron clientes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <nav>
        <ul className="pagination justify-content-center">
          {Array.from({ length: totalPages }, (_, i) => (
            <li
              key={i}
              className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}
            >
              <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                {i + 1}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Clientes;
