"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function CuentaCorriente() {
  const [fichas, setFichas] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [modalItem, setModalItem] = useState(null);
  const [modalTipo, setModalTipo] = useState(null);
  const [montoPago, setMontoPago] = useState("");
  const [obsPago, setObsPago] = useState("");
  const [guardando, setGuardando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.push("/"); return; }
      cargarDatos();
    };
    checkUser();
  }, []);

  const cargarDatos = async () => {
    const { data: f } = await supabase.from("fichas_opticas").select("*, clientes(nombre, apellido)").gt("monto_total", 0).order("created_at", { ascending: false });
    if (f) setFichas(f);
    const { data: v } = await supabase.from("ventas").select("*, clientes(nombre, apellido)").gt("precio_venta", 0).order("created_at", { ascending: false });
    if (v) setVentas(v);
    setLoading(false);
  };

  const todosLosItems = [
    ...fichas.map(f => ({
      id: f.id,
      tipo: "ficha",
      cliente: f.clientes,
      fecha: f.fecha_examen,
      descripcion: "Ficha optica",
      total: f.monto_total || 0,
      sena: f.sena || 0,
      raw: f,
    })),
    ...ventas.map(v => ({
      id: v.id,
      tipo: "venta",
      cliente: v.clientes,
      fecha: v.fecha,
      descripcion: v.descripcion || "Venta",
      total: v.precio_venta || 0,
      sena: v.sena || 0,
      raw: v,
    })),
  ];

  const itemsFiltrados = todosLosItems.filter(i => {
    const nombre = ((i.cliente?.nombre || "") + " " + (i.cliente?.apellido || "")).toLowerCase();
    return nombre.includes(busqueda.toLowerCase());
  });

  const pendientes = itemsFiltrados.filter(i => (i.total - i.sena) > 0);
  const pagados = itemsFiltrados.filter(i => (i.total - i.sena) <= 0);
  const totalPendiente = pendientes.reduce((acc, i) => acc + (i.total - i.sena), 0);

  const abrirModal = (item) => { setModalItem(item); setModalTipo(item.tipo); setMontoPago(""); setObsPago(""); };
  const cerrarModal = () => { setModalItem(null); setModalTipo(null); setMontoPago(""); setObsPago(""); };

  const registrarPago = async () => {
    if (!montoPago || parseFloat(montoPago) <= 0) return;
    setGuardando(true);
    const nuevaSena = (modalItem.sena || 0) + parseFloat(montoPago);
    if (modalTipo === "ficha") {
      await supabase.from("pagos").insert([{ ficha_id: modalItem.id, monto: parseFloat(montoPago), observaciones: obsPago }]);
      await supabase.from("fichas_opticas").update({ sena: nuevaSena }).eq("id", modalItem.id);
    } else {
      await supabase.from("ventas").update({ sena: nuevaSena }).eq("id", modalItem.id);
    }
    setGuardando(false);
    cerrarModal();
    cargarDatos();
  };

  const menuItems = [
    { label: "Inicio", path: "/dashboard" },
    { label: "Clientes", path: "/clientes" },
    { label: "Fichas opticas", path: "/fichas" },
    { label: "Lentes de contacto", path: "/lentes-contacto" },
    { label: "Ventas", path: "/ventas" },
    { label: "Cuenta corriente", path: "/cuenta-corriente" },
    { label: "Por oftalmologo", path: "/oftalmologos" },
    { label: "Eval. Neurosensorial", path: "/neurosensorial" },
    { label: "Terapias", path: "/terapias" },
    { label: "Calendario Terapia", path: "/calendario-terapia" },
    { label: "Horarios disponibles", path: "/horarios-disponibles" },
  ];

  const Fila = ({ item }) => {
    const saldo = item.total - item.sena;
    const pagado = saldo <= 0;
    return (
      <tr style={{ borderBottom: "1px solid #f0f2f5" }}>
        <td style={{ padding: "12px 16px", color: "#1e3a5f", fontWeight: "500", cursor: "pointer" }} onClick={() => item.tipo === "ficha" ? router.push("/fichas/" + item.id) : router.push("/ventas/" + item.id)}>
          {item.cliente ? item.cliente.apellido + ", " + item.cliente.nombre : "Sin cliente"}
        </td>
        <td style={{ padding: "12px 16px", color: "#6b7a8f" }}>{item.fecha}</td>
        <td style={{ padding: "12px 16px", color: "#6b7a8f" }}>
          <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "11px", background: item.tipo === "ficha" ? "#E6F1FB" : "#EAF3DE", color: item.tipo === "ficha" ? "#185FA5" : "#27500A" }}>
            {item.tipo === "ficha" ? "Ficha" : "Venta"}
          </span>
        </td>
        <td style={{ padding: "12px 16px", color: "#6b7a8f" }}>{item.descripcion}</td>
        <td style={{ padding: "12px 16px", color: "#1e3a5f" }}>${item.total.toLocaleString("es-AR")}</td>
        <td style={{ padding: "12px 16px", color: "#1e3a5f" }}>${item.sena.toLocaleString("es-AR")}</td>
        <td style={{ padding: "12px 16px", fontWeight: "600", color: pagado ? "#27500A" : "#854F0B" }}>${saldo.toLocaleString("es-AR")}</td>
        <td style={{ padding: "12px 16px" }}>
          <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", background: pagado ? "#EAF3DE" : "#FAEEDA", color: pagado ? "#27500A" : "#854F0B" }}>
            {pagado ? "PAGADO" : "PENDIENTE"}
          </span>
        </td>
        <td style={{ padding: "12px 16px" }}>
          {!pagado && (
            <button onClick={() => abrirModal(item)} style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: "4px", padding: "5px 12px", cursor: "pointer", fontSize: "12px" }}>
              Registrar pago
            </button>
          )}
        </td>
      </tr>
    );
  };

  const encabezados = () => (
    <tr style={{ background: "#f4f7fb", borderBottom: "1px solid #dde3ec" }}>
      <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Cliente</th>
      <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Fecha</th>
      <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Tipo</th>
      <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Descripcion</th>
      <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Total</th>
      <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Sena</th>
      <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Saldo</th>
      <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Estado</th>
      <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Accion</th>
    </tr>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f7fb" }}>
      <div style={{ width: "220px", background: "#1e3a5f", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid #2a4f7a" }}>
          <div style={{ fontSize: "16px", fontWeight: "600", color: "#fff" }}>Optica Ponce</div>
          <div style={{ fontSize: "12px", color: "#85b7eb", marginTop: "2px" }}>Sistema de gestion</div>
        </div>
        <div style={{ flex: 1, padding: "10px 0" }}>
          {menuItems.map(item => (
            <div key={item.path} onClick={() => router.push(item.path)} style={{ padding: "11px 20px", color: item.path === "/cuenta-corriente" ? "#fff" : "#b5d4f4", background: item.path === "/cuenta-corriente" ? "#185FA5" : "transparent", cursor: "pointer", fontSize: "14px" }}>
              {item.label}
            </div>
          ))}
        </div>
        <div style={{ padding: "14px 20px", borderTop: "1px solid #2a4f7a" }}>
          <div onClick={async () => { await supabase.auth.signOut(); router.push("/"); }} style={{ color: "#f09595", cursor: "pointer", fontSize: "14px" }}>Cerrar sesion</div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #dde3ec", padding: "14px 24px" }}>
          <span style={{ fontSize: "15px", fontWeight: "600", color: "#1e3a5f" }}>Cuenta corriente</span>
        </div>

        <div style={{ padding: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
            <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "16px" }}>
              <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "6px" }}>Total pendiente</div>
              <div style={{ fontSize: "24px", fontWeight: "600", color: "#854F0B" }}>${totalPendiente.toLocaleString("es-AR")}</div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "16px" }}>
              <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "6px" }}>Items pendientes</div>
              <div style={{ fontSize: "24px", fontWeight: "600", color: "#854F0B" }}>{pendientes.length}</div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "16px" }}>
              <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "6px" }}>Items pagados</div>
              <div style={{ fontSize: "24px", fontWeight: "600", color: "#27500A" }}>{pagados.length}</div>
            </div>
          </div>

          <input type="text" placeholder="Buscar por nombre de cliente..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ width: "100%", padding: "10px 14px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", marginBottom: "16px", boxSizing: "border-box" }} />

          {pendientes.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", overflow: "hidden", marginBottom: "24px" }}>
              <div style={{ padding: "12px 16px", background: "#FAEEDA", borderBottom: "1px solid #dde3ec", fontSize: "13px", fontWeight: "600", color: "#854F0B" }}>
                Pendientes de pago ({pendientes.length})
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>{encabezados()}</thead>
                <tbody>{pendientes.map(i => <Fila key={i.tipo + i.id} item={i} />)}</tbody>
              </table>
            </div>
          )}

          {pagados.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", background: "#EAF3DE", borderBottom: "1px solid #dde3ec", fontSize: "13px", fontWeight: "600", color: "#27500A" }}>
                Pagados ({pagados.length})
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>{encabezados()}</thead>
                <tbody>{pagados.map(i => <Fila key={i.tipo + i.id} item={i} />)}</tbody>
              </table>
            </div>
          )}

          {!loading && itemsFiltrados.length === 0 && (
            <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "24px", textAlign: "center", color: "#6b7a8f", fontSize: "13px" }}>
              No hay registros todavia
            </div>
          )}
        </div>
      </div>

      {modalItem && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", width: "400px" }}>
            <div style={{ fontSize: "15px", fontWeight: "600", color: "#1e3a5f", marginBottom: "6px" }}>Registrar pago</div>
            <div style={{ fontSize: "13px", color: "#6b7a8f", marginBottom: "20px" }}>
              {modalItem.cliente ? modalItem.cliente.apellido + ", " + modalItem.cliente.nombre : "Sin cliente"} — {modalItem.descripcion}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px", fontSize: "13px" }}>
              <div>
                <div style={{ color: "#6b7a8f", marginBottom: "4px" }}>Total</div>
                <div style={{ fontWeight: "600", color: "#1e3a5f" }}>${modalItem.total.toLocaleString("es-AR")}</div>
              </div>
              <div>
                <div style={{ color: "#6b7a8f", marginBottom: "4px" }}>Saldo pendiente</div>
                <div style={{ fontWeight: "600", color: "#854F0B" }}>${(modalItem.total - modalItem.sena).toLocaleString("es-AR")}</div>
              </div>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "4px" }}>Monto a pagar</div>
              <input type="number" value={montoPago} onChange={(e) => setMontoPago(e.target.value)} placeholder="0" style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "4px" }}>Observaciones</div>
              <input type="text" value={obsPago} onChange={(e) => setObsPago(e.target.value)} placeholder="Opcional..." style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={cerrarModal} style={{ flex: 1, padding: "10px", border: "1px solid #dde3ec", borderRadius: "6px", background: "transparent", cursor: "pointer", fontSize: "13px", color: "#6b7a8f" }}>Cancelar</button>
              <button onClick={registrarPago} disabled={guardando} style={{ flex: 1, padding: "10px", border: "none", borderRadius: "6px", background: "#185FA5", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}>
                {guardando ? "Guardando..." : "Confirmar pago"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}