import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, Button, Card, Form, Alert, Row, Col } from 'react-bootstrap';

const RolesPermisos = () => {
  const [roles, setRoles] = useState([]);
  const [permisosPorRol, setPermisosPorRol] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState({});
  const [saveStatus, setSaveStatus] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/admin/roles', {
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          setRoles(data);
          await Promise.all(
            data.map(async (rol) => {
              const permResponse = await fetch(`http://localhost:5000/api/admin/roles/${rol.id}/permisos`, {
                headers: { 'Content-Type': 'application/json' },
              });
              if (permResponse.ok) {
                const permData = await permResponse.json();
                setPermisosPorRol(prev => ({ ...prev, [rol.id]: permData }));
              }
            })
          );
        } else {
          setError('Error al cargar roles');
        }
      } catch (err) {
        setError('Error de conexión');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  const handleCheckboxChange = (rolId, permisoId) => {
    setPermisosPorRol(prev => {
      const permisosActuales = prev[rolId] || [];
      return {
        ...prev,
        [rolId]: permisosActuales.map(p => p.id === permisoId ? { ...p, asignado: !p.asignado } : p)
      };
    });
  };

  const handleSavePermisos = async (rolId) => {
    setSaving(prev => ({ ...prev, [rolId]: true }));
    setSaveStatus(prev => ({ ...prev, [rolId]: '' }));
    try {
      const permisos = permisosPorRol[rolId] || [];
      const permisoIds = permisos.filter(p => p.asignado).map(p => p.id);

      const response = await fetch(`http://localhost:5000/api/admin/roles/${rolId}/permisos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permiso_ids: permisoIds }),
      });

      if (response.ok) {
        setSaveStatus(prev => ({ ...prev, [rolId]: 'success' }));
      } else {
        const data = await response.json();
        setSaveStatus(prev => ({ ...prev, [rolId]: 'error' }));
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      setSaveStatus(prev => ({ ...prev, [rolId]: 'error' }));
      alert('Error de conexión al guardar');
      console.error(err);
    } finally {
      setSaving(prev => ({ ...prev, [rolId]: false }));
    }
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
      <Spinner animation="border" variant="primary" />
      <span className="ms-2">Cargando roles y permisos...</span>
    </div>
  );

  if (error) return (
    <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '60vh' }}>
      <Alert variant="danger">{error}</Alert>
      <Button onClick={() => window.location.reload()}>Reintentar</Button>
    </div>
  );

  return (
    <div className="container py-4">
      <h2 className="text-center mb-4">Gestión de Roles y Permisos</h2>

      {roles.length === 0 ? (
        <Alert variant="secondary" className="text-center">No hay roles disponibles. Crea uno primero.</Alert>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {roles.map(rol => (
            <Col key={rol.id}>
              <Card className="shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <span>{rol.nombre}</span>
                  <small className="text-muted">Permisos</small>
                </Card.Header>
                <Card.Body>
                  <Form>
                    <Row xs={1} md={2} className="g-2 mb-3">
                      {(permisosPorRol[rol.id] || []).map(permiso => (
                        <Col key={permiso.id}>
                          <Form.Check 
                            type="checkbox"
                            id={`permiso-${rol.id}-${permiso.id}`}
                            label={permiso.nombre}
                            checked={permiso.asignado || false}
                            onChange={() => handleCheckboxChange(rol.id, permiso.id)}
                          />
                        </Col>
                      ))}
                    </Row>
                    <Button 
                      variant="primary" 
                      onClick={() => handleSavePermisos(rol.id)}
                      disabled={saving[rol.id]}
                    >
                      {saving[rol.id] ? 'Guardando...' : 'Guardar Permisos'}
                    </Button>
                    {saveStatus[rol.id] && (
                      <span className={`ms-2 text-${saveStatus[rol.id] === 'success' ? 'success' : 'danger'}`}>
                        {saveStatus[rol.id] === 'success' ? '✓ Guardado' : '✗ Error'}
                      </span>
                    )}
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default RolesPermisos;
