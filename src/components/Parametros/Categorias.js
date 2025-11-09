import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Categorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    descripcion: '',
    activo: true
  });
  const [modo, setModo] = useState('create');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const navigate = useNavigate();

  // Cargar categorías
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/parametros/categorias');
        if (res.ok) {
          const data = await res.json();
          setCategorias(data);
        } else {
          setError('Error al cargar datos');
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
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }));
    if (error) setError('');
  };

  const handleEdit = (categoria) => {
    setFormData({
      id: categoria.id,
      nombre: categoria.nombre || '',
      descripcion: categoria.descripcion || '',
      activo: categoria.activo !== false,  // Default true
    });
    setModo('edit');
    setSuccess('');
    document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancel = () => {
    setFormData({
      id: '',
      nombre: '',
      descripcion: '',
      activo: true
    });
    setModo('create');
    setError('');
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
        ? `http://localhost:5000/api/parametros/categorias/${formData.id}`
        : 'http://localhost:5000/api/parametros/categorias';
    const method = modo === 'edit' ? 'PUT' : 'POST';

    const body =
      modo === 'edit'
        ? {
            nombre: formData.nombre,
            descripcion: formData.descripcion || null,
            activo: formData.activo
          }
        : {
            nombre: formData.nombre,
            descripcion: formData.descripcion || null
          };

    try {
      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (resp.ok) {
        setSuccess(modo === 'edit' ? 'Categoría actualizada' : 'Categoría creada');
        handleCancel();
        const reload = await fetch('http://localhost:5000/api/parametros/categorias');
        setCategorias(await reload.json());
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Error en la operación');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`¿Eliminar esta categoría? ID: ${id}\n(Se chequean productos asociados)`)) return;
    try {
      const resp = await fetch(`http://localhost:5000/api/parametros/categorias/${id}`, {
        method: 'DELETE',
      });
      const data = await resp.json();
      if (resp.ok) {
        setSuccess('Categoría eliminada');
        setCategorias(await (await fetch('http://localhost:5000/api/parametros/categorias')).json());
      } else {
        setError(data.message || 'Error al eliminar');
      }
    } catch {
      setError('Error al eliminar');
    }
  };

  const filteredCategorias = categorias.filter(
    (c) =>
      c.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const formatActivo = (activo) =>
    activo ? 'Sí' : 'No';

  const totalPages = Math.ceil(filteredCategorias.length / itemsPerPage);
  const currentData = filteredCategorias.slice(
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
      <h1 className="text-center">Gestión de Categorías</h1>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Formulario */}
      <div id="form-section" className="card mb-4">
        <div className="card-header">
          {modo === 'edit' ? 'Editar Categoría' : 'Crear Categoría'}
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Nombre y Descripción */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label>Nombre *</label>
                <input
                  type="text"
                  className="form-control"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej: Corte"
                  required
                  maxLength="100"
                />
                <small className="form-text text-muted">Nombre único para asociar productos</small>
              </div>
              <div className="col-md-6 mb-3">
                <label>Descripción (Opcional)</label>
                <textarea
                  className="form-control"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Descripción breve de la categoría"
                  maxLength="500"
                />
              </div>
            </div>
            {/* Checkbox activo (solo en edit) */}
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
        placeholder="Buscar por nombre..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Tabla */}
      <div className="table-responsive">
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
              currentData.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.nombre}</td>
                  <td>{c.descripcion || '-'}</td>
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
                <td colSpan="5" className="text-center">
                  No se encontraron categorías
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

export default Categorias;
