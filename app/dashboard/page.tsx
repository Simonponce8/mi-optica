"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [cumpleanos, setCumpleanos] = useState([]);
  const [totalClientes, setTotalClientes] = useState(0);
  const [totalPendiente, setTotalPendiente] = useState(0);
  const [vencidos, setVencidos] = useState([]);
  const [descartados, setDescartados] = useState([]);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.push("/"); return; }
      const guardados = JSON.parse(localStorage.getItem("descartados_vencidos") || "[]");
      setDescartados(guardados);
      cargarDatos();
    };
    checkUser();
  }, []);

  const cargarDatos = async () => {
    const hoy = new Date();
    const mes = hoy.getMonth() + 1;
    const dia = hoy.getDate();

    const { data: clientes } = await supabase.from("clientes").select("*");
    if (clientes) {
      setTotalClientes(clientes.length);
      const cumples = clientes.filter(c => {
        if (!c.fecha_nacimiento) return false;
        const partes = c.fecha_nacimiento.split(/[-\/]/);
        const fechaMes = parseInt(partes[1]);
        const fechaDia = parseInt(partes[2]);
        return fechaMes === mes && fechaDia === dia;
      });
      setCumpleanos(cumples);
    }

    const { data: fichas } = await supabase.from("fichas_opticas").select("*, clientes(id, nombre, apellido, telefono)").gt("monto_total", 0);
    if (fichas) {
      const pendiente = fichas.reduce((acc, f) => acc + ((f.monto_total || 0) - (f.sena || 0)), 0);
      setTotalPendiente(Math.max(0, pendiente));

      const hace35dias = new Date();
      hace35dias.setDate(hace35dias.getDate() - 35);
      const limite = hace35dias.toISOString().split("T")[0];

      const sinPago = fichas.filter(f => {
        const saldo = (f.monto_total || 0) - (f.sena || 0);
        if (saldo <= 0) return false;
        return f.fecha_examen <= limite && (f.sena === 0 || f.sena === null);
      });

      const { data: ventas } = await supabase.from("ventas").select("*, clientes(id, nombre, apellido, telefono)").gt("precio_venta", 0);

      const ventasVencidas = ventas ? ventas.filter(v => {
        const saldo = (v.precio_venta || 0) - (v.sena || 0);
        if (saldo <= 0) return false;
        return v.fecha <= limite && (v.sena === 0 || v.sena === null);
      }) : [];

      setVencidos([
        ...sinPago.map(f => ({ ...f, tipo: "ficha", itemId: "ficha-" + f.id })),
        ...ventasVencidas.map(v => ({ ...v, tipo: "venta", itemId: "venta-" + v.id })),
      ]);
    }
  };

  const descartar = (itemId) => {
    const nuevos = [...descartados, itemId];
    setDescartados(nuevos);
    localStorage.setItem("descartados_vencidos", JSON.stringify(nuevos));
  };

  const abrirWhatsappVencido = (item) => {
    const cliente = item.clientes;
    if (!cliente) return;
    const nombre = cliente.nombre + " " + cliente.apellido;
    const saldo = ((item.tipo === "ficha" ? item.monto_total : item.precio_venta) - (item.sena || 0)).toLocaleString("es-AR");
    const mensaje = encodeURIComponent("Hola " + nombre + "!\nLe recordamos desde Optica Ponce que tiene un saldo pendiente de $" + saldo + ".\nCuando pueda acercarse o comunicarse con nosotros lo agradecemos.\nMuchas gracias!");
    const telefono = cliente.telefono ? cliente.telefono.replace(/\D/g, "") : "";
    if (telefono) {
      window.open("https://wa.me/" + telefono + "?text=" + mensaje, "_blank");
    } else {
      window.open("https://wa.me/?text=" + mensaje, "_blank");
    }
  };

  const abrirWhatsapp = (cliente) => {
    const nombre = cliente.nombre + " " + cliente.apellido;
    const mensaje = encodeURIComponent("Hola " + nombre + "!\nDesde Optica Ponce queremos desearte un muy feliz cumplea\u00F1os \uD83C\uDF82\uD83C\uDF89\uD83E\uDD73\nQue tengas un hermoso dia y un excelente a\u00F1o por delante \uD83D\uDE0A\nGracias por confiar en nosotros! \uD83D\uDC53");
    const telefono = cliente.telefono ? cliente.telefono.replace(/\D/g, "") : "";
    if (telefono) {
      window.open("https://wa.me/" + telefono + "?text=" + mensaje, "_blank");
    } else {
      window.open("https://wa.me/?text=" + mensaje, "_blank");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
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
  ];

  const vencidosVisibles = vencidos.filter(i => !descartados.includes(i.itemId));

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f7fb" }}>
      <div style={{ width: "220px", background: "#1e3a5f", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid #2a4f7a" }}>
          <div style={{ fontSize: "16px", fontWeight: "600", color: "#fff" }}>Optica Ponce</div>
          <div style={{ fontSize: "12px", color: "#85b7eb", marginTop: "2px" }}>Sistema de gestion</div>
        </div>
        <div style={{ flex: 1, padding: "10px 0" }}>
          {menuItems.map(item => (
            <div key={item.path} onClick={() => router.push(item.path)} style={{ padding: "11px 20px", color: item.path === "/dashboard" ? "#fff" : "#b5d4f4", background: item.path === "/dashboard" ? "#185FA5" : "transparent", cursor: "pointer", fontSize: "14px" }}>
              {item.label}
            </div>
          ))}
        </div>
        <div style={{ padding: "14px 20px", borderTop: "1px solid #2a4f7a" }}>
          <div onClick={handleLogout} style={{ color: "#f09595", cursor: "pointer", fontSize: "14px" }}>Cerrar sesion</div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #dde3ec", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "15px", fontWeight: "600", color: "#1e3a5f" }}>Panel principal</span>
          <span style={{ fontSize: "12px", color: "#6b7a8f" }}>
            {new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </span>
        </div>

        <div style={{ padding: "24px" }}>

          {cumpleanos.length > 0 && (
            <div style={{ background: "#FAEEDA", border: "1px solid #FAC775", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#633806", marginBottom: "12px" }}>Cumpleanos de hoy</div>
              {cumpleanos.map(c => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid #FAC775" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "500", color: "#412402" }}>{c.apellido}, {c.nombre}</div>
                    {c.telefono && <div style={{ fontSize: "12px", color: "#854F0B", marginTop: "2px" }}>{c.telefono}</div>}
                  </div>
                  <button onClick={() => abrirWhatsapp(c)} style={{ background: "#25D366", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 14px", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}>
                    Enviar WhatsApp
                  </button>
                </div>
              ))}
            </div>
          )}

          {vencidosVisibles.length > 0 && (
            <div style={{ background: "#FCEBEB", border: "1px solid #F7C1C1", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#A32D2D", marginBottom: "12px" }}>
                Saldos sin movimiento hace mas de 35 dias ({vencidosVisibles.length})
              </div>
              {vencidosVisibles.map(item => {
                const saldo = ((item.tipo === "ficha" ? item.monto_total : item.precio_venta) - (item.sena || 0));
                return (
                  <div key={item.itemId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid #F7C1C1" }}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "500", color: "#501313" }}>
                        {item.clientes?.apellido}, {item.clientes?.nombre}
                      </div>
                      <div style={{ fontSize: "12px", color: "#A32D2D", marginTop: "2px" }}>
                        {item.tipo === "ficha" ? "Ficha optica" : item.descripcion} — {item.tipo === "ficha" ? item.fecha_examen : item.fecha}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#A32D2D" }}>
                        ${saldo.toLocaleString("es-AR")}
                      </div>
                      <button onClick={() => abrirWhatsappVencido(item)} style={{ background: "#25D366", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", fontSize: "12px" }}>
                        WhatsApp
                      </button>
                      <button onClick={() => descartar(item.itemId)} style={{ background: "transparent", color: "#A32D2D", border: "1px solid #F7C1C1", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", fontSize: "12px" }}>
                        Descartar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
            <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "16px", cursor: "pointer" }} onClick={() => router.push("/clientes")}>
              <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "6px" }}>Clientes totales</div>
              <div style={{ fontSize: "24px", fontWeight: "600", color: "#1e3a5f" }}>{totalClientes}</div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "16px", cursor: "pointer" }} onClick={() => router.push("/cuenta-corriente")}>
              <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "6px" }}>Saldo pendiente</div>
              <div style={{ fontSize: "24px", fontWeight: "600", color: "#854F0B" }}>${totalPendiente.toLocaleString("es-AR")}</div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "16px" }}>
              <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "6px" }}>Cumpleanos hoy</div>
              <div style={{ fontSize: "24px", fontWeight: "600", color: cumpleanos.length > 0 ? "#854F0B" : "#1e3a5f" }}>{cumpleanos.length}</div>
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "16px" }}>
            <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e3a5f", marginBottom: "12px" }}>Accesos rapidos</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              <div onClick={() => router.push("/clientes/nuevo")} style={{ background: "#E6F1FB", color: "#185FA5", borderRadius: "8px", padding: "14px", cursor: "pointer", fontSize: "13px", fontWeight: "500", textAlign: "center" }}>+ Nuevo cliente</div>
              <div onClick={() => router.push("/cuenta-corriente")} style={{ background: "#FAEEDA", color: "#854F0B", borderRadius: "8px", padding: "14px", cursor: "pointer", fontSize: "13px", fontWeight: "500", textAlign: "center" }}>Cuenta corriente</div>
              <div onClick={() => router.push("/clientes")} style={{ background: "#EAF3DE", color: "#27500A", borderRadius: "8px", padding: "14px", cursor: "pointer", fontSize: "13px", fontWeight: "500", textAlign: "center" }}>Ver clientes</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}