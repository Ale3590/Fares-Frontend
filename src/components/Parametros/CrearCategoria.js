import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CrearCategoria = () => {
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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/parametros/categorias');
        if (response.ok) {
          const data = await response.json();
          setCategorias(data);
        } else {
          setError('Error al cargar categorías');
        }
      } catch (err) {
        setError('Error de conexión');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategorias();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const handleEdit = (categoria) => {
    setFormData({
      id: categoria.id,
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || '',
      activo: categoria.activo
    });
    setModo('edit');
    setSuccess('');
    document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancel = () => {
    setFormData({ id: '', nombre: '', descripcion: '', activo: true });
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

    const url = modo === 'edit' 
      ? `http://localhost:5000/api/parametros/categorias/${formData.id}` 
      : 'http://localhost:5000/api/parametros/categorias';
    const method = modo === 'edit' ? 'PUT' : 'POST';

    const body = modo === 'edit' 
      ? { nombre: formData.nombre, descripcion: formData.descripcion || null, activo: formData.activo }
      : { nombre: formData.nombre, descripcion: formData.descripcion || null };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(modo === 'edit' ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente');
        setFormData({ id: '', nombre: '', descripcion: '', activo: true });
        setModo('create');
        const resp = await fetch('http://localhost:5000/api/parametros/categorias');
        const newData = await resp.json();
        setCategorias(newData);
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
    if (!window.confirm(`¿Seguro que quieres eliminar esta categoría? ID: ${id}\n(Se chequean productos asociados)`)) return;

    try {
      const response = await fetch(`http://localhost:5000/api/parametros/categorias/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Categoría eliminada exitosamente');
        const resp = await fetch('http://localhost:5000/api/parametros/categorias');
        const newData = await resp.json();
        setCategorias(newData);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Error al eliminar');
      }
    } catch (err) {
      setError('Error de conexión al eliminar');
      console.error(err);
    }
  };

  const filteredCategorias = categorias.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mt-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-2">Cargando categorías...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Gestión de Categorías (para Productos)</h1>

      {/* Form Section */}
      <div id="form-section" className="card mb-4">
        <div className="card-header text-center">
          <h2 className="mb-0">
            {modo === 'edit' ? `Editar Categoría ID: ${formData.id}` : 'Crear Nueva Categoría'}
          </h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-bold">Nombre *:</label>
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
              <small className="form-text text-muted">Nombre único para asociar productos (ej. Blusa, Pantalón)</small>
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Descripción (Opcional):</label>
              <textarea
                className="form-control"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                rows="3"
                placeholder="Descripción breve de la categoría (ej. Prendas superiores)"
                maxLength="500"
              />
            </div>
            {modo === 'edit' && (
              <div className="mb-3 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleInputChange}
                />
                <label className="form-check-label fw-bold">Activo (Inactivar oculta en selects de productos)</label>
              </div>
            )}

            <div className="d-flex justify-content-center gap-2">
              <button 
                type="submit" 
                className={`btn ${saving ? 'btn-secondary' : 'btn-success'}`}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    {modo === 'edit' ? 'Actualizando...' : 'Creando...'}
                  </>
                ) : (
                  modo === 'edit' ? 'Actualizar Categoría' : 'Crear Categoría'
                )}
              </button>
              {modo === 'edit' && (
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {error && (
            <div className="alert alert-danger mt-3 text-center" role="alert">
              ✗ {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success mt-3 text-center" role="alert">
              ✓ {success}
            </div>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h2 className="mb-0">Lista de Categorías ({filteredCategorias.length})</h2>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '300px' }}
          />
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped table-hover mb-0">
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
                {filteredCategorias.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">
                      {search ? 'No hay categorías que coincidan' : 'No hay categorías. Crea una arriba.'}
                    </td>
                  </tr>
                ) : (
                  filteredCategorias.map((categoria) => (
                    <tr key={categoria.id}>
                      <td>{categoria.id}</td>
                      <td>{categoria.nombre}</td>
                      <td>{categoria.descripcion || '-'}</td>
                      <td>
                        <span className={categoria.activo ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                          {categoria.activo ? 'Sí' : 'No'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-primary btn-sm me-1" onClick={() => handleEdit(categoria)}>
                          ✏️ Editar
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(categoria.id)}>
                          🗑️ Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrearCategoria;
