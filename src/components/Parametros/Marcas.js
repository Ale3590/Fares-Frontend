import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Marcas = () => {
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    activo: true,
  });
  const [modo, setModo] = useState('create');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const navigate = useNavigate();

  // Cargar marcas
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/parametros/marcas');
        if (res.ok) {
          const data = await res.json();
          setMarcas(data);
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

  const handleEdit = (marca) => {
    setFormData({
      id: marca.id,
      nombre: marca.nombre || '',
      activo: marca.activo !== false,  // Por default true si no definido
    });
    setModo('edit');
    setSuccess('');
    document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancel = () => {
    setFormData({
      id: '',
      nombre: '',
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

    if (!formData.nombre.trim()) {
      setError('Nombre es requerido');
      setSaving(false);
      return;
    }

    const url =
      modo === 'edit'
        ? `http://localhost:5000/api/parametros/marcas/${formData.id}`
        : 'http://localhost:5000/api/parametros/marcas';
    const method = modo === 'edit' ? 'PUT' : 'POST';

    const body =
      modo === 'edit'
        ? formData  // Envía todo (nombre y activo)
        : {
            nombre: formData.nombre,
            activo: true,  // Default en create
          };

    try {
      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (resp.ok) {
        setSuccess(modo === 'edit' ? 'Marca actualizada' : 'Marca creada');
        handleCancel();
        const reload = await fetch('http://localhost:5000/api/parametros/marcas');
        setMarcas(await reload.json());
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
    if (!window.confirm('¿Eliminar esta marca?')) return;
    try {
      const resp = await fetch(`http://localhost:5000/api/parametros/marcas/${id}`, {
        method: 'DELETE',
      });
      const data = await resp.json();
      if (resp.ok) {
        setSuccess('Marca eliminada');
        setMarcas(await (await fetch('http://localhost:5000/api/parametros/marcas')).json());
      } else {
        setError(data.message || 'Error al eliminar');
      }
    } catch {
      setError('Error al eliminar');
    }
  };

  const filteredMarcas = marcas.filter(
    (m) =>
      m.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const formatActivo = (activo) =>
    activo ? 'Sí' : 'No';

  const totalPages = Math.ceil(filteredMarcas.length / itemsPerPage);
  const currentData = filteredMarcas.slice(
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
      <h1 className="text-center">Gestión de Marcas</h1>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Formulario */}
      <div id="form-section" className="card mb-4">
        <div className="card-header">
          {modo === 'edit' ? 'Editar Marca' : 'Crear Marca'}
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Nombre */}
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
              {/* Espacio vacío para alinear con Productos */}
              <div className="col-md-6 mb-3"></div>
            </div>
            {/* Checkbox activo (solo en edit, como inactivo en Productos) */}
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
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length > 0 ? (
              currentData.map((m) => (
                <tr key={m.id}>
                  <td>{m.id}</td>
                  <td>{m.nombre}</td>
                  <td>
                    <span className={`badge ${m.activo ? 'bg-success' : 'bg-danger'}`}>
                      {formatActivo(m.activo)}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-warning me-2"
                      onClick={() => handleEdit(m)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(m.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center">
                  No se encontraron marcas
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

export default Marcas;
