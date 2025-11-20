// src/components/Login/Login.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

// 🔥 Aquí tomamos la variable del entorno de Vercel
const API = process.env.REACT_APP_API_URL;

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const getToken = () => localStorage.getItem("token");

  // Verifica si ya hay sesión activa
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const response = await fetch(`${API}/api/auth/verify`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            localStorage.setItem("user", JSON.stringify(data.user));
            navigate("/dashboard");
          } else {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
        } catch {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token || "");
        localStorage.setItem("user", JSON.stringify(data.user));
        alert(`¡Bienvenido, ${data.user.nombre}! Rol: ${data.user.rol}`);
        navigate("/dashboard");
      } else {
        if (response.status === 401)
          setError("Credenciales inválidas: Username o password incorrecto");
        else if (response.status === 500)
          setError("Error en el servidor. Verifica que el backend esté en Render.");
        else setError(data.message || "Error en el login");

        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    } catch {
      setError("Error de conexión: No se pudo conectar con el servidor.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-image"></div>
      <div className="login-container">
        <div className="login-box animate-fade">
          <h2>Bienvenido a FARES</h2>
          <p>Inicia sesión para acceder al sistema</p>

          {error && <div className="alert alert-danger">⚠️ {error}</div>}

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <input
                type="text"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder=" "
              />
              <label>Usuario</label>
            </div>

            <div className="input-group password-group">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder=" "
              />
              <label>Contraseña</label>
              <span
                className="show-pass"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "" : "👁️"}
              </span>
            </div>

            <div className="login-actions">
              <button type="submit" disabled={loading}>
                {loading ? <span className="spinner"></span> : "Ingresar"}
              </button>
            </div>
          </form>

          <small className="mt-3">
            ¿Olvidaste tu contraseña? <a href="#">Recupérala aquí</a>
          </small>
        </div>
      </div>
    </div>
  );
};

export default Login;
