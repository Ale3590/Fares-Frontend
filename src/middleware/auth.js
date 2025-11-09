const jwt = require('jsonwebtoken');
const db = require('../config/db'); // Para verificar user en BD si es necesario

const auth = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Acceso denegado. No hay token.' });
    }

    // Verificar y decodificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secret_key'); // Usa env var en prod
    
    // Opcional: Verificar que el user existe en BD y está activo
    const query = 'SELECT id, username, rol_id, activo FROM usuario WHERE id = $1 AND activo = true';
    const result = await db.query(query, [decoded.id]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Token inválido o usuario inactivo.' });
    }
    
    req.user = result.rows[0]; // Adjunta user a req para usarlo en controllers
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido.' });
  }
};

// Middleware opcional para roles (ej. solo admins)
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol_id)) { // Asumiendo rol_id es numérico (1=admin, etc.)
      return res.status(403).json({ error: 'Acceso denegado. Rol insuficiente.' });
    }
    next();
  };
};

module.exports = { auth, requireRole };