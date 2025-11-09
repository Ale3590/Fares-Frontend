import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]); // Estado para marcas
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: '',
    codigo: '',
    nombre: '',
    marca: '',
    categoria: '',
    existencia_minima: 0,
    fecha_oferta_inicio: '',
    fecha_oferta_fin: '',
    precio_publico: '',
    precio_mayorista: '',
    precio_oferta_publico: '',
    precio_oferta_mayorista: '',
    inactivo: false,
  });
  const [modo, setModo] = useState('create');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const navigate = useNavigate();

  // Cargar productos, categorías y marcas
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes, marcasRes] = await Promise.all([
          fetch('http://localhost:5000/api/parametros/productos'),
          fetch('http://localhost:5000/api/parametros/categorias?activo=true'),
          fetch('http://localhost:5000/api/parametros/marcas?activo=true')
        ]);

        if (prodRes.ok && catRes.ok && marcasRes.ok) {
          const prods = await prodRes.json();
          const cats = await catRes.json();
          const marcasData = await marcasRes.json();
          setProductos(prods);
          setCategorias([{ nombre: 'General' }, ...cats.map(c => ({ nombre: c.nombre }))]);
          setMarcas([{ nombre: 'General' }, ...marcasData.map(m => ({ nombre: m.nombre }))]);
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
    setFormData(prev => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : type === 'number'
          ? value === ''
            ? ''
            : parseFloat(value) || 0
          : value,
    }));
    if (error) setError('');
  };

  const handleEdit = (producto) => {
    setFormData({
      id: producto.id,
      codigo: producto.codigo || '',
      nombre: producto.nombre || '',
      marca: producto.marca || '',
      categoria: producto.categoria || '',
      existencia_minima: producto.existencia_minima || 0,
      fecha_oferta_inicio: producto.fecha_oferta_inicio
        ? producto.fecha_oferta_inicio.split('T')[0]
        : '',
      fecha_oferta_fin: producto.fecha_oferta_fin
        ? producto.fecha_oferta_fin.split('T')[0]
        : '',
      precio_publico: producto.precio_publico || '',
      precio_mayorista: producto.precio_mayorista || '',
      precio_oferta_publico: producto.precio_oferta_publico || '',
      precio_oferta_mayorista: producto.precio_oferta_mayorista || '',
      inactivo: producto.inactivo || false,
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
      marca: '',
      categoria: '',
      existencia_minima: 0,
      fecha_oferta_inicio: '',
      fecha_oferta_fin: '',
      precio_publico: '',
      precio_mayorista: '',
      precio_oferta_publico: '',
      precio_oferta_mayorista: '',
      inactivo: false,
    });
    setModo('create');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    if (!formData.codigo.trim() || !formData.nombre.trim()) {
      setError('Código y nombre son requeridos');
      setSaving(false);
      return;
    }

    if (formData.existencia_minima < 0) {
      setError('Existencia mínima debe ser >= 0');
      setSaving(false);
      return;
    }

    const url =
      modo === 'edit'
        ? `http://localhost:5000/api/parametros/productos/${formData.id}`
        : 'http://localhost:5000/api/parametros/productos';
    const method = modo === 'edit' ? 'PUT' : 'POST';

    const body =
      modo === 'edit'
        ? formData
        : {
            codigo: formData.codigo,
            nombre: formData.nombre,
            marca: formData.marca || null,
            categoria: formData.categoria || 'General',
            existencia_minima: parseInt(formData.existencia_minima) || 0,
            fecha_oferta_inicio: formData.fecha_oferta_inicio || null,
            fecha_oferta_fin: formData.fecha_oferta_fin || null,
            precio_publico: parseFloat(formData.precio_publico) || null,
            precio_mayorista: parseFloat(formData.precio_mayorista) || null,
            precio_oferta_publico: parseFloat(formData.precio_oferta_publico) || null,
            precio_oferta_mayorista: parseFloat(formData.precio_oferta_mayorista) || null,
            inactivo: false,
          };

    try {
      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (resp.ok) {
        setSuccess(modo === 'edit' ? 'Producto actualizado' : 'Producto creado');
        handleCancel();
        const reload = await fetch('http://localhost:5000/api/parametros/productos');
        setProductos(await reload.json());
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
    if (!window.confirm('¿Eliminar este producto?')) return;
    try {
      const resp = await fetch(`http://localhost:5000/api/parametros/productos/${id}`, {
        method: 'DELETE',
      });
      const data = await resp.json();
      if (resp.ok) {
        setSuccess('Producto eliminado');
        setProductos(await (await fetch('http://localhost:5000/api/parametros/productos')).json());
      } else {
        setError(data.message || 'Error al eliminar');
      }
    } catch {
      setError('Error al eliminar');
    }
  };

  const filteredProductos = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo.toLowerCase().includes(search.toLowerCase())
  );

  const formatPrecio = (precio) =>
  precio ? `Q ${parseFloat(precio).toFixed(2)}` : '-';
  const formatFecha = (fecha) =>
    fecha ? new Date(fecha).toLocaleDateString('es-ES') : '-';

  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage);
  const currentData = filteredProductos.slice(
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
      <h1 className="text-center">Gestión de Productos</h1>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Formulario */}
      <div id="form-section" className="card mb-4">
        <div className="card-header">
          {modo === 'edit' ? 'Editar Producto' : 'Crear Producto'}
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Código y nombre */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label>Código *</label>
                <input
                  type="text"
                  className="form-control"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleInputChange}
                  disabled={modo === 'edit'}
                  required
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

            {/* Marca y categoría */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label>Marca</label>
                <select
                  className="form-select"
                  name="marca"
                  value={formData.marca}
                  onChange={handleInputChange}
                >
                  <option value="">Seleccione...</option>
                  {marcas.map((m, i) => (
                    <option key={i} value={m.nombre}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label>Categoría</label>
                <select
                  className="form-select"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleInputChange}
                >
                  <option value="">Seleccione...</option>
                  {categorias.map((c, i) => (
                    <option key={i} value={c.nombre}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Existencia mínima y precios */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label>Existencia mínima</label>
                <input
                  type="number"
                  className="form-control"
                  name="existencia_minima"
                  value={formData.existencia_minima}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label>Precio público</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  name="precio_publico"
                  value={formData.precio_publico}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>

            {/* Precios adicionales y fechas de oferta */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label>Precio mayorista</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  name="precio_mayorista"
                  value={formData.precio_mayorista}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label>Oferta público</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  name="precio_oferta_publico"
                  value={formData.precio_oferta_publico}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label>Oferta mayorista</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  name="precio_oferta_mayorista"
                  value={formData.precio_oferta_mayorista}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="col-md-3 mb-3">
                <label>Inicio oferta</label>
                <input
                  type="date"
                  className="form-control"
                  name="fecha_oferta_inicio"
                  value={formData.fecha_oferta_inicio}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-3 mb-3">
                <label>Fin oferta</label>
                <input
                  type="date"
                  className="form-control"
                  name="fecha_oferta_fin"
                  value={formData.fecha_oferta_fin}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Checkbox inactivo */}
            {modo === 'edit' && (
              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  className="form-check-input"
                  name="inactivo"
                  checked={formData.inactivo}
                  onChange={handleInputChange}
                />
                <label className="form-check-label">Inactivo</label>
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
        placeholder="Buscar por nombre o código..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Tabla */}
      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-dark">
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Marca</th>
              <th>Categoría</th>
              <th>Exist. Mínima</th>
              <th>Precio Público</th>
              <th>Mayorista</th>
              <th>Oferta Pub.</th>
              <th>Oferta May.</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length > 0 ? (
              currentData.map((p) => (
                <tr key={p.id}>
                  <td>{p.codigo}</td>
                  <td>{p.nombre}</td>
                  <td>{p.marca || '-'}</td>
                  <td>{p.categoria || '-'}</td>
                  <td>{p.existencia_minima}</td>
                  <td>{formatPrecio(p.precio_publico)}</td>
                  <td>{formatPrecio(p.precio_mayorista)}</td>
                  <td>{formatPrecio(p.precio_oferta_publico)}</td>
                  <td>{formatPrecio(p.precio_oferta_mayorista)}</td>
                  <td>{formatFecha(p.fecha_oferta_inicio)}</td>
                  <td>{formatFecha(p.fecha_oferta_fin)}</td>
                  <td>{p.inactivo ? 'No' : 'Sí'}</td>
                  <td>
                    <button className="btn btn-sm btn-warning me-1" onClick={() => handleEdit(p)}>
                      Editar
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="13" className="text-center">No hay productos</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="d-flex justify-content-between">
        <button
          className="btn btn-secondary"
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Anterior
        </button>
        <span>Página {currentPage} de {totalPages}</span>
        <button
          className="btn btn-secondary"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default Productos;
