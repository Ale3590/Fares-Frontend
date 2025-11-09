import React, { useState, useEffect } from 'react';

const TiposPago = () => {
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    descripcion: '',
    activo: true,
  });
  const [modo, setModo] = useState('create');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Cargar Tipos de Pago
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/parametros/tipos-pago');
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setTipos(data);
      } catch (error) {
        console.error('Error fetching tipos pago:', error);  // <-- MEJORADO: Para debuggear
        setError('Error de conexión o ruta no encontrada. Verifica el backend.');
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
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEdit = (t) => {
    setFormData({
      id: t.id,
      nombre: t.nombre || '',
      descripcion: t.descripcion || '',
      activo: t.activo !== false,
    });
    setModo('edit');
  };

  const handleCancel = () => {
    setFormData({ id: '', nombre: '', descripcion: '', activo: true });
    setModo('create');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    if (!formData.nombre.trim()) {
      setError('Nombre es requerido');
      setSaving(false);
      return;
    }

    const url =
      modo === 'edit'
        ? `http://localhost:5000/api/parametros/tipos-pago/${formData.id}`
        : 'http://localhost:5000/api/parametros/tipos-pago';
    const method = modo === 'edit' ? 'PUT' : 'POST';

    try {
      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await resp.json();
      if (resp.ok) {
        setSuccess(modo === 'edit' ? 'Tipo de pago actualizado' : 'Tipo de pago creado');
        handleCancel();
        const reload = await fetch('http://localhost:5000/api/parametros/tipos-pago');
        setTipos(await reload.json());
      } else {
        setError(data.message || 'Error en la operación');
      }
    } catch (error) {
      console.error('Error en handleSubmit:', error);  // <-- MEJORADO: Para debuggear
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este tipo de pago?')) return;
    try {
      const resp = await fetch(`http://localhost:5000/api/parametros/tipos-pago/${id}`, {
        method: 'DELETE',
      });
      if (resp.ok) {
        setSuccess('Tipo de pago eliminado');
        const reload = await fetch('http://localhost:5000/api/parametros/tipos-pago');
        setTipos(await reload.json());
      } else {
        const data = await resp.json();
        setError(data.message || 'Error al eliminar');
      }
    } catch (error) {
      console.error('Error en handleDelete:', error);  // <-- MEJORADO: Para debuggear
      setError('Error al eliminar');
    }
  };

  const filtered = tipos.filter((t) =>
    t.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="container mt-4">
      <h1 className="text-center">Gestión de Tipos de Pago</h1>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Formulario */}
      <div className="card mb-4">
        <div className="card-header">
          {modo === 'edit' ? 'Editar Tipo de Pago' : 'Crear Tipo de Pago'}
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
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
              <div className="col-md-6 mb-3">
                <label>Descripción</label>
                <input
                  type="text"
                  className="form-control"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                />
              </div>
            </div>

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

            <div className="text-end">
              <button
                type="button"
                className="btn btn-secondary me-2"
                onClick={handleCancel}
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
        placeholder="Buscar por nombre..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Tabla */}
      <table className="table table-bordered table-hover">
        <thead className="table-dark">
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {currentData.length > 0 ? (
            currentData.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.nombre}</td>
                <td>{t.descripcion || '-'}</td>
                <td>
                  <span className={`badge ${t.activo ? 'bg-success' : 'bg-danger'}`}>
                    {t.activo ? 'Sí' : 'No'}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-warning me-2"
                    onClick={() => handleEdit(t)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(t.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center">
                No se encontraron tipos de pago
              </td>
            </tr>
          )}
        </tbody>
      </table>

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

export default TiposPago;