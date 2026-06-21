"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

export default function NuevaVenta() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clientes, setClientes] = useState([]);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [form, setForm] = useState({
    cliente_id: "",
    fecha: new Date().toISOString().split("T")[0],
    descripcion: "",
    marca: "",
    modelo: "",
    precio_venta: "",
    sena: "",
    forma_pago: "",
    observaciones: "",
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.push("/"); return; }
      const { data: cl } = await supabase.from("clientes").select("id, nombre, apellido").order("apellido");
      if (cl) setClientes(cl);
    };
    checkUser();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const clientesFiltrados = clientes.filter(c =>
    (c.apellido + " " + c.nombre).toLowerCase().includes(busquedaCliente.toLowerCase())
  );

  const saldo = (parseFloat(form.precio_venta) || 0) - (parseFloat(form.sena) || 0);

  const handleGuardar = async () => {
    if (!form.descripcion) { setError("La descripcion del producto es obligatoria"); return; }
    setLoading(true);
    const datos = {
      fecha: form.fecha,
      descripcion: form.descripcion,
      precio_venta: parseFloat(form.precio_venta) || 0,
      sena: parseFloat(form.sena) || 0,
      estado: saldo <= 0 ? "pagado" : "pendiente",
    };
    if (form.cliente_id) datos.cliente_id = form.cliente_id;
    if (form.marca) datos.marca = form.marca;
    if (form.modelo) datos.modelo = form.modelo;
    if (form.forma_pago) datos.forma_pago = form.forma_pago;
    if (form.observaciones) datos.observaciones = form.observaciones;
    const { error } = await supabase.from("ventas").insert([datos]);
    if (error) { setError("Error al guardar: " + error.message); setLoading(false); }
    else { router.push("/ventas"); }
  };

  const menuItems = [
    { label: "Inicio", path: "/dashboard" },
    { label: "Clientes", path: "/clientes" },
    { label: "Fichas opticas", path: "/fichas" },
    { label: "Lentes de contacto", path: "/lentes-contacto" },
    { label: "Ventas", path: "/ventas" },
    { label: "Cuenta corriente", path: "/cuenta-corriente" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f7fb" }}>
      <div style={{ width: "220px", background: "#1e3a5f", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid #2a4f7a" }}>
          <div style={{ fontSize: "16px", fontWeight: "600", color: "#fff" }}>Optica Ponce</div>
          <div style={{ fontSize: "12px", color: "#85b7eb", marginTop: "2px" }}>Sistema de gestion</div>
        </div>
        <div style={{ flex: 1, padding: "10px 0" }}>
          {menuItems.map(item => (
            <div key={item.path} onClick={() => router.push(item.path)} style={{ padding: "11px 20px", color: item.path === "/ventas" ? "#fff" : "#b5d4f4", background: item.path === "/ventas" ? "#185FA5" : "transparent", cursor: "pointer", fontSize: "14px" }}>
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
          <span style={{ fontSize: "15px", fontWeight: "600", color: "#1e3a5f" }}>Nueva venta</span>
          <button onClick={() => router.push("/ventas")} style={{ background: "transparent", color: "#6b7a8f", border: "1px solid #dde3ec", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontSize: "13px" }}>
            Cancelar
          </button>
        </div>

        <div style={{ padding: "24px", maxWidth: "650px" }}>
          {error && <div style={{ background: "#FCEBEB", color: "#A32D2D", padding: "10px 14px", borderRadius: "6px", marginBottom: "16px", fontSize: "13px" }}>{error}</div>}

          <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7a8f", display: "block", marginBottom: "4px" }}>Fecha</label>
                <input name="fecha" type="date" value={form.fecha} onChange={handleChange} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7a8f", display: "block", marginBottom: "4px" }}>Cliente (opcional)</label>
                <select name="cliente_id" value={form.cliente_id} onChange={handleChange} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", background: "#fff" }}>
                  <option value="">Sin cliente</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.apellido}, {c.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: "12px", color: "#6b7a8f", display: "block", marginBottom: "4px" }}>Descripcion del producto *</label>
              <input name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Ej: Anteojo de sol, Armazon, Estuche..." style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7a8f", display: "block", marginBottom: "4px" }}>Marca</label>
                <input name="marca" value={form.marca} onChange={handleChange} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7a8f", display: "block", marginBottom: "4px" }}>Modelo</label>
                <input name="modelo" value={form.modelo} onChange={handleChange} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "12px", color: "#6b7a8f", display: "block", marginBottom: "4px" }}>Forma de pago</label>
              <select name="forma_pago" value={form.forma_pago} onChange={handleChange} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", background: "#fff" }}>
                <option value="">Seleccionar...</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Tarjeta debito">Tarjeta debito</option>
                <option value="Tarjeta credito">Tarjeta credito</option>
                <option value="Mercado Pago">Mercado Pago</option>
              </select>
            </div>

            <div style={{ borderTop: "1px solid #f0f2f5", paddingTop: "14px" }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f", marginBottom: "12px" }}>Informacion contable</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", alignItems: "end" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "#6b7a8f", display: "block", marginBottom: "4px" }}>Precio de venta</label>
                  <input name="precio_venta" type="number" value={form.precio_venta} onChange={handleChange} placeholder="0" style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "#6b7a8f", display: "block", marginBottom: "4px" }}>Sena</label>
                  <input name="sena" type="number" value={form.sena} onChange={handleChange} placeholder="0" style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "#6b7a8f", display: "block", marginBottom: "4px" }}>Saldo</label>
                  <div style={{ padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", background: "#f4f7fb", fontWeight: "600", color: saldo > 0 ? "#854F0B" : "#27500A" }}>
                    ${saldo.toLocaleString("es-AR")}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: "10px" }}>
                <span style={{ padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", background: saldo > 0 ? "#FAEEDA" : "#EAF3DE", color: saldo > 0 ? "#854F0B" : "#27500A" }}>
                  {saldo > 0 ? "PENDIENTE" : "PAGADO"}
                </span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: "12px", color: "#6b7a8f", display: "block", marginBottom: "4px" }}>Observaciones</label>
              <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={3} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", resize: "vertical" }} />
            </div>

            <button onClick={handleGuardar} disabled={loading} style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: "6px", padding: "10px 20px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}>
              {loading ? "Guardando..." : "Guardar venta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}