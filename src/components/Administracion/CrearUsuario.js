import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CrearUsuario = () => {
  const [roles, setRoles] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: '',
    username: '',
    password: '',
    nombre: '',
    rol_id: '',
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

  // Cargar roles y usuarios (Promise.all como en Productos)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, usuariosRes] = await Promise.all([
          fetch('http://localhost:5000/api/admin/roles'),
          fetch('http://localhost:5000/api/admin/usuarios')
        ]);
        if (rolesRes.ok && usuariosRes.ok) {
          const rolesData = await rolesRes.json();
          const usuariosData = await usuariosRes.json();
          setRoles(rolesData);
          setUsuarios(usuariosData);
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

  const handleEdit = (usuario) => {
    setFormData({
      id: usuario.id,
      username: usuario.username,
      password: '',  // Vacío en edit (opcional)
      nombre: usuario.nombre || '',
      rol_id: usuario.rol_id.toString(),
      activo: usuario.activo !== false,  // Default true
    });
    setModo('edit');
    setSuccess('');
    document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancel = () => {
    setFormData({
      id: '',
      username: '',
      password: '',
      nombre: '',
      rol_id: '',
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

    if (!formData.username.trim() || !formData.nombre.trim() || !formData.rol_id) {
      setError('Username, nombre y rol son requeridos');
      setSaving(false);
      return;
    }
    if (modo === 'create' && !formData.password.trim()) {
      setError('Password es requerido para crear usuario');
      setSaving(false);
      return;
    }

    const url =
      modo === 'edit'
        ? `http://localhost:5000/api/admin/usuarios/${formData.id}`
        : 'http://localhost:5000/api/admin/usuarios';
    const method = modo === 'edit' ? 'PUT' : 'POST';

    const body =
      modo === 'edit'
        ? {
            username: formData.username,
            password: formData.password || undefined,  // Opcional en edit
            nombre: formData.nombre,
            rol_id: parseInt(formData.rol_id),
            activo: formData.activo
          }
        : {
            username: formData.username,
            password: formData.password,
            nombre: formData.nombre,
            rol_id: parseInt(formData.rol_id)
          };

    try {
      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (resp.ok) {
        setSuccess(modo === 'edit' ? 'Usuario actualizado' : 'Usuario creado');
        handleCancel();
        const reload = await fetch('http://localhost:5000/api/admin/usuarios');
        setUsuarios(await reload.json());
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
    if (!window.confirm('¿Eliminar este usuario?')) return;
    try {
      const resp = await fetch(`http://localhost:5000/api/admin/usuarios/${id}`, {
        method: 'DELETE',
      });
      const data = await resp.json();
      if (resp.ok) {
        setSuccess('Usuario eliminado');
        setUsuarios(await (await fetch('http://localhost:5000/api/admin/usuarios')).json());
      } else {
        setError(data.message || 'Error al eliminar');
      }
    } catch {
      setError('Error al eliminar');
    }
  };

  const filteredUsuarios = usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  const formatActivo = (activo) =>
    activo ? 'Sí' : 'No';

  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);
  const currentData = filteredUsuarios.slice(
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

  const getRolColor = (rolNombre) => {
    const colors = {
      admin: 'text-danger',
      facturador: 'text-success',
      vendedor: 'text-info',
      comprador: 'text-warning'
    };
    return colors[rolNombre.toLowerCase()] || 'text-secondary';
  };

  return (
    <div className="container mt-4">
      <h1 className="text-center">Gestión de Usuarios</h1>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Formulario */}
      <div id="form-section" className="card mb-4">
        <div className="card-header">
          {modo === 'edit' ? 'Editar Usuario' : 'Crear Usuario'}
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Username y Password */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label>Username *</label>
                <input
                  type="text"
                  className="form-control"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={modo === 'edit'}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label>Password {modo === 'edit' ? '(Opcional)' : '(Requerido)'} *</label>
                <input
                  type="password"
                  className="form-control"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={modo === 'create'}
                />
              </div>
            </div>
            {/* Nombre y Rol */}
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
                <label>Rol *</label>
                <select
                  className="form-select"
                  name="rol_id"
                  value={formData.rol_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Seleccione...</option>
                  {roles.map((rol) => (
                    <option key={rol.id} value={rol.id}>
                      {rol.nombre} {rol.descripcion && `- ${rol.descripcion}`}
                    </option>
                  ))}
                </select>
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
        placeholder="Buscar por nombre o username..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Tabla */}
      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length > 0 ? (
              currentData.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.nombre}</td>
                  <td>
                    <span className={getRolColor(u.rol_nombre)}>{u.rol_nombre}</span>
                  </td>
                  <td>
                    <span className={`badge ${u.activo ? 'bg-success' : 'bg-danger'}`}>
                      {formatActivo(u.activo)}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-warning me-2"
                      onClick={() => handleEdit(u)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(u.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">
                  No se encontraron usuarios
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

export default CrearUsuario;

