"use client";
import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

export default function NuevoCliente() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const [clienteGuardadoId, setClienteGuardadoId] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    telefono: "",
    email: "",
    fecha_nacimiento: "",
    obra_social: "",
    observaciones: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGuardar = async () => {
    if (!form.nombre || !form.apellido) {
      setError("Nombre y apellido son obligatorios");
      return;
    }
    setLoading(true);
    const datos = { nombre: form.nombre, apellido: form.apellido };
    if (form.dni) datos.dni = form.dni;
    if (form.telefono) datos.telefono = form.telefono;
    if (form.email) datos.email = form.email;
    if (form.fecha_nacimiento) datos.fecha_nacimiento = form.fecha_nacimiento;
    if (form.obra_social) datos.obra_social = form.obra_social;
    if (form.observaciones) datos.observaciones = form.observaciones;
    const { data, error } = await supabase.from("clientes").insert([datos]).select().single();
    if (error) {
      setError("Error al guardar el cliente");
      setLoading(false);
    } else {
      setClienteGuardadoId(data.id);
      setLoading(false);
      setMostrarOpciones(true);
    }
  };

  if (mostrarOpciones) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#f4f7fb", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "12px", padding: "32px", maxWidth: "420px", width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: "22px", marginBottom: "8px" }}>Cliente guardado</div>
          <div style={{ fontSize: "14px", color: "#6b7a8f", marginBottom: "28px" }}>
            {form.apellido}, {form.nombre} fue agregado correctamente.
            <br />¿Que queres hacer ahora?
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <button onClick={() => router.push("/fichas/nueva?cliente_id=" + clienteGuardadoId)} style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: "8px", padding: "12px 20px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}>
              Agregar ficha optica
            </button>
            <button onClick={() => router.push("/lentes-contacto/nueva?cliente_id=" + clienteGuardadoId)} style={{ background: "#1D9E75", color: "#fff", border: "none", borderRadius: "8px", padding: "12px 20px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}>
              Agregar lentes de contacto
            </button>
            <button onClick={() => router.push("/clientes/" + clienteGuardadoId)} style={{ background: "transparent", color: "#6b7a8f", border: "1px solid #dde3ec", borderRadius: "8px", padding: "12px 20px", cursor: "pointer", fontSize: "14px" }}>
              Ver ficha del cliente
            </button>
            <button onClick={() => router.push("/clientes")} style={{ background: "transparent", color: "#6b7a8f", border: "1px solid #dde3ec", borderRadius: "8px", padding: "12px 20px", cursor: "pointer", fontSize: "14px" }}>
              Volver a la lista
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f7fb" }}>
      <div style={{ width: "220px", background: "#1e3a5f", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid #2a4f7a" }}>
          <div style={{ fontSize: "16px", fontWeight: "600", color: "#fff" }}>Optica Ponce</div>
          <div style={{ fontSize: "12px", color: "#85b7eb", marginTop: "2px" }}>Sistema de gestion</div>
        </div>
        <div style={{ flex: 1, padding: "10px 0" }}>
          {[
            { label: "Inicio", path: "/dashboard" },
            { label: "Clientes", path: "/clientes" },
            { label: "Fichas opticas", path: "/fichas" },
            { label: "Lentes de contacto", path: "/lentes-contacto" },
            { label: "Ventas", path: "/ventas" },
            { label: "Cuenta corriente", path: "/cuenta-corriente" },
          ].map(item => (
            <div key={item.path} onClick={() => router.push(item.path)} style={{ padding: "11px 20px", color: item.path === "/clientes" ? "#fff" : "#b5d4f4", background: item.path === "/clientes" ? "#185FA5" : "transparent", cursor: "pointer", fontSize: "14px" }}>
              {item.label}
            </div>
          ))}
        </div>
        <div style={{ padding: "14px 20px", borderTop: "1px solid #2a4f7a" }}>
          <div onClick={async () => { await supabase.auth.signOut(); router.push("/"); }} style={{ color: "#f09595", cursor: "pointer", fontSize: "14px" }}>Cerrar sesion</div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #dde3ec", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "15px", fontWeight: "600", color: "#1e3a5f" }}>Nuevo cliente</span>
          <button onClick={() => router.push("/clientes")} style={{ background: "transparent", color: "#6b7a8f", border: "1px solid #dde3ec", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontSize: "13px" }}>
            Cancelar
          </button>
        </div>

        <div style={{ padding: "24px", maxWidth: "600px" }}>
          {error && <div style={{ background: "#FCEBEB", color: "#A32D2D", padding: "10px 14px", borderRadius: "6px", marginBottom: "16px", fontSize: "13px" }}>{error}</div>}

          <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7a8f", display: "block", marginBottom: "4px" }}>Nombre *</label>
                <input name="nombre" value={form.nombre} onChange={handleChange} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7a8f", display: "block", marginBottom: "4px" }}>Apellido *</label>
                <input name="apellido" value={form.apellido} onChange={handleChange} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7a8f", display: "block", marginBottom: "4px" }}>DNI</label>
                <input name="dni" value={form.dni} onChange={handleChange} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7a8f", display: "block", marginBottom: "4px" }}>Telefono</label>
                <input name="telefono" value={form.telefono} onChange={handleChange} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7a8f", display: "block", marginBottom: "4px" }}>Email</label>
                <input name="email" value={form.email} onChange={handleChange} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7a8f", display: "block", marginBottom: "4px" }}>Fecha de nacimiento</label>
                <input name="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={handleChange} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "#6b7a8f", display: "block", marginBottom: "4px" }}>Obra social</label>
              <input name="obra_social" value={form.obra_social} onChange={handleChange} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "#6b7a8f", display: "block", marginBottom: "4px" }}>Observaciones</label>
              <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={3} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", resize: "vertical" }} />
            </div>
            <button onClick={handleGuardar} disabled={loading} style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: "6px", padding: "10px 20px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}>
              {loading ? "Guardando..." : "Guardar cliente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}