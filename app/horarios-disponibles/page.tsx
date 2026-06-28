"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

const HORARIOS_MANANA = ["09:30", "09:45", "10:00", "10:15", "10:30", "10:45", "11:00", "11:15"];
const HORARIOS_TARDE = ["16:30", "16:45", "17:00", "17:15", "17:30", "17:45", "18:00", "18:15", "18:30", "18:45", "19:00", "19:15", "19:30"];
const DURACION_MIN = 45;

const diasSemana = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
const diasSemanaCorto = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

const horaAMinutos = (hora) => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};

export default function HorariosDisponibles() {
  const router = useRouter();
  const [fechaActual, setFechaActual] = useState(new Date());
  const [diasSeleccionados, setDiasSeleccionados] = useState([]);
  const [franja, setFranja] = useState("ambas");
  const [turnos, setTurnos] = useState([]);
  const [seleccionFinal, setSeleccionFinal] = useState({});
  const [mostrarImagen, setMostrarImagen] = useState(false);
  const [reservados, setReservados] = useState({});
  const [clientes, setClientes] = useState([]);
  const [modalReserva, setModalReserva] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.push("/"); return; }
      cargarTurnos();
      const { data: cl } = await supabase.from("clientes").select("id, nombre, apellido").eq("es_paciente_terapia", true).order("apellido");
      if (cl) setClientes(cl);
    };
    checkUser();
  }, []);

  const cargarTurnos = async () => {
    const { data } = await supabase.from("turnos_terapia").select("fecha, hora, duracion").neq("estado", "Cancelado");
    if (data) setTurnos(data);
  };

  const fmt = (d) => d.toISOString().split("T")[0];

  const inicioMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
  const finMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
  const primerDiaSemana = inicioMes.getDay();
  const diasEnMes = finMes.getDate();
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const celdas = [];
  for (let i = 0; i < primerDiaSemana; i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d);

  const toggleDia = (dia) => {
    if (!dia) return;
    const fechaStr = fmt(new Date(fechaActual.getFullYear(), fechaActual.getMonth(), dia));
    setDiasSeleccionados(prev =>
      prev.includes(fechaStr) ? prev.filter(f => f !== fechaStr) : [...prev, fechaStr].sort()
    );
  };

  const horariosLibresPorDia = (fechaStr) => {
    const horariosBase = franja === "manana" ? HORARIOS_MANANA : franja === "tarde" ? HORARIOS_TARDE : [...HORARIOS_MANANA, ...HORARIOS_TARDE];
    const turnosDelDia = turnos.filter(t => t.fecha === fechaStr);
    return horariosBase.filter(hora => {
      const inicioNuevo = horaAMinutos(hora);
      const finNuevo = inicioNuevo + DURACION_MIN;
      const ocupado = turnosDelDia.some(t => {
        const inicioOcupado = horaAMinutos(t.hora);
        const finOcupado = inicioOcupado + (t.duracion || 45);
        return inicioNuevo < finOcupado && finNuevo > inicioOcupado;
      });
      return !ocupado;
    });
  };

  const toggleHorario = (fechaStr, hora) => {
    setSeleccionFinal(prev => {
      const actuales = prev[fechaStr] || [];
      const yaEsta = actuales.includes(hora);
      const nuevos = yaEsta ? actuales.filter(h => h !== hora) : [...actuales, hora].sort();
      return { ...prev, [fechaStr]: nuevos };
    });
  };

  const cambiarMes = (delta) => {
    setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() + delta, 1));
  };

  const totalSeleccionados = Object.values(seleccionFinal).reduce((acc, arr) => acc + arr.length, 0);

  const generarTextoMensaje = () => {
    let texto = "TURNOS DISPONIBLES - TERAPIA VISUAL\n\n";
    Object.keys(seleccionFinal).sort().forEach(fechaStr => {
      const horas = (seleccionFinal[fechaStr] || []).filter(h => !reservados[fechaStr + "_" + h]);
      if (horas.length === 0) return;
      const fechaObj = new Date(fechaStr + "T00:00:00");
      const diaNombre = diasSemana[fechaObj.getDay()];
      const fechaCorta = fechaObj.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
      texto += diaNombre + " " + fechaCorta + "\n";
      horas.forEach(h => { texto += h + "\n"; });
      texto += "\n";
    });
    texto += "Te envio una lista con los horarios disponibles.";
    return texto;
  };

  const copiarMensaje = () => {
    navigator.clipboard.writeText(generarTextoMensaje());
    alert("Mensaje copiado al portapapeles");
  };

  const abrirWhatsapp = () => {
    const mensaje = encodeURIComponent(generarTextoMensaje());
    window.open("https://wa.me/?text=" + mensaje, "_blank");
  };

  const abrirModalReserva = (fechaStr, hora) => {
    setModalReserva({ fechaStr, hora, cliente_id: "" });
  };

  const confirmarReserva = async () => {
    if (!modalReserva.cliente_id) { alert("Selecciona un paciente"); return; }
    await supabase.from("horarios_compartidos").insert([{ fecha: modalReserva.fechaStr, hora: modalReserva.hora, reservado: true }]);
    await supabase.from("turnos_terapia").insert([{
      cliente_id: modalReserva.cliente_id,
      fecha: modalReserva.fechaStr,
      hora: modalReserva.hora,
      duracion: 45,
      estado: "Confirmado",
    }]);
    setReservados(prev => ({ ...prev, [modalReserva.fechaStr + "_" + modalReserva.hora]: true }));
    setModalReserva(null);
    cargarTurnos();
    alert("Turno creado y horario marcado como reservado.");
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

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f7fb" }}>
      <div style={{ width: "220px", background: "#1e3a5f", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid #2a4f7a" }}>
          <div style={{ fontSize: "16px", fontWeight: "600", color: "#fff" }}>Optica Ponce</div>
          <div style={{ fontSize: "12px", color: "#85b7eb", marginTop: "2px" }}>Sistema de gestion</div>
        </div>
        <div style={{ flex: 1, padding: "10px 0" }}>
          {menuItems.map(item => (
            <div key={item.path} onClick={() => router.push(item.path)} style={{ padding: "11px 20px", color: item.path === "/horarios-disponibles" ? "#fff" : "#b5d4f4", background: item.path === "/horarios-disponibles" ? "#185FA5" : "transparent", cursor: "pointer", fontSize: "14px" }}>
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
          <span style={{ fontSize: "15px", fontWeight: "600", color: "#1e3a5f" }}>Horarios disponibles para compartir</span>
        </div>

        <div style={{ padding: "24px", maxWidth: "900px" }}>

          <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f", marginBottom: "12px" }}>1. Elegi los dias</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <button onClick={() => cambiarMes(-1)} style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "6px", padding: "6px 12px", cursor: "pointer" }}>‹</button>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f" }}>{meses[fechaActual.getMonth()]} {fechaActual.getFullYear()}</span>
              <button onClick={() => cambiarMes(1)} style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "6px", padding: "6px 12px", cursor: "pointer" }}>›</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
              {diasSemanaCorto.map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: "11px", color: "#6b7a8f", fontWeight: "600", padding: "4px" }}>{d}</div>
              ))}
              {celdas.map((dia, i) => {
                if (!dia) return <div key={i}></div>;
                const fechaStr = fmt(new Date(fechaActual.getFullYear(), fechaActual.getMonth(), dia));
                const seleccionado = diasSeleccionados.includes(fechaStr);
                return (
                  <div key={i} onClick={() => toggleDia(dia)} style={{ textAlign: "center", padding: "8px 4px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", background: seleccionado ? "#185FA5" : "#f4f7fb", color: seleccionado ? "#fff" : "#1e3a5f", fontWeight: seleccionado ? "600" : "400" }}>
                    {dia}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f", marginBottom: "12px" }}>2. Elegi la franja horaria</div>
            <div style={{ display: "flex", gap: "8px" }}>
              {[["manana", "Manana"], ["tarde", "Tarde"], ["ambas", "Ambas"]].map(([val, label]) => (
                <button key={val} onClick={() => setFranja(val)} style={{ padding: "8px 18px", borderRadius: "20px", border: "1px solid", fontSize: "13px", cursor: "pointer", background: franja === val ? "#185FA5" : "#f4f7fb", color: franja === val ? "#fff" : "#1e3a5f", borderColor: franja === val ? "#185FA5" : "#dde3ec" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {diasSeleccionados.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f", marginBottom: "16px" }}>3. Elegi los horarios libres a ofrecer</div>
              {diasSeleccionados.map(fechaStr => {
                const libres = horariosLibresPorDia(fechaStr);
                const fechaObj = new Date(fechaStr + "T00:00:00");
                return (
                  <div key={fechaStr} style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid #f0f2f5" }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f", marginBottom: "8px" }}>
                      {diasSemana[fechaObj.getDay()]} {fechaObj.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}
                    </div>
                    {libres.length === 0 ? (
                      <div style={{ fontSize: "12px", color: "#6b7a8f" }}>No hay horarios libres en esta franja para este dia</div>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {libres.map(hora => {
                          const elegido = (seleccionFinal[fechaStr] || []).includes(hora);
                          return (
                            <button key={hora} onClick={() => toggleHorario(fechaStr, hora)} style={{ padding: "6px 14px", borderRadius: "6px", border: "1px solid", fontSize: "13px", cursor: "pointer", background: elegido ? "#27500A" : "#f4f7fb", color: elegido ? "#fff" : "#1e3a5f", borderColor: elegido ? "#27500A" : "#dde3ec" }}>
                              {hora}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {totalSeleccionados > 0 && (
            <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f", marginBottom: "16px" }}>4. Compartir ({totalSeleccionados} horarios elegidos)</div>

              <div style={{ background: "#f4f7fb", borderRadius: "8px", padding: "16px", marginBottom: "16px", fontSize: "13px", color: "#1e3a5f", whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                {generarTextoMensaje()}
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={copiarMensaje} style={{ flex: 1, background: "#E6F1FB", color: "#185FA5", border: "none", borderRadius: "6px", padding: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}>
                  Copiar mensaje
                </button>
                <button onClick={abrirWhatsapp} style={{ flex: 1, background: "#25D366", color: "#fff", border: "none", borderRadius: "6px", padding: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}>
                  Abrir WhatsApp
                </button>
                <button onClick={() => setMostrarImagen(true)} style={{ flex: 1, background: "#185FA5", color: "#fff", border: "none", borderRadius: "6px", padding: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}>
                  Generar imagen
                </button>
              </div>
            </div>
          )}

          {totalSeleccionados > 0 && (
            <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "20px" }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f", marginBottom: "8px" }}>5. Marcar horario como reservado</div>
              <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "14px" }}>
                Cuando un paciente confirme uno de los horarios ofrecidos, marcalo aqui para crear el turno automaticamente y que deje de ofrecerse.
              </div>
              {Object.keys(seleccionFinal).sort().map(fechaStr => {
                const horas = seleccionFinal[fechaStr] || [];
                if (horas.length === 0) return null;
                const fechaObj = new Date(fechaStr + "T00:00:00");
                return (
                  <div key={fechaStr} style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "12px", fontWeight: "600", color: "#1e3a5f", marginBottom: "6px" }}>
                      {diasSemana[fechaObj.getDay()]} {fechaObj.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {horas.map(hora => {
                        const yaReservado = reservados[fechaStr + "_" + hora];
                        return (
                          <button key={hora} disabled={yaReservado} onClick={() => abrirModalReserva(fechaStr, hora)} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #dde3ec", fontSize: "12px", cursor: yaReservado ? "default" : "pointer", background: yaReservado ? "#EAF3DE" : "#f4f7fb", color: yaReservado ? "#27500A" : "#1e3a5f" }}>
                            {hora} {yaReservado ? "✓ Reservado" : ""}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {modalReserva && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", width: "360px" }}>
            <div style={{ fontSize: "15px", fontWeight: "600", color: "#1e3a5f", marginBottom: "6px" }}>Confirmar reserva</div>
            <div style={{ fontSize: "13px", color: "#6b7a8f", marginBottom: "16px" }}>
              {modalReserva.fechaStr} a las {modalReserva.hora}
            </div>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "4px" }}>Paciente</div>
              <select value={modalReserva.cliente_id} onChange={(e) => setModalReserva({ ...modalReserva, cliente_id: e.target.value })} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", background: "#fff" }}>
                <option value="">Seleccionar...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.apellido}, {c.nombre}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={confirmarReserva} style={{ flex: 1, background: "#185FA5", color: "#fff", border: "none", borderRadius: "6px", padding: "10px", cursor: "pointer", fontSize: "13px" }}>
                Confirmar y crear turno
              </button>
              <button onClick={() => setModalReserva(null)} style={{ background: "transparent", color: "#6b7a8f", border: "1px solid #dde3ec", borderRadius: "6px", padding: "10px 16px", cursor: "pointer", fontSize: "13px" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarImagen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", maxHeight: "90vh", overflowY: "auto" }}>
            <div id="imagen-horarios" style={{ width: "400px", background: "linear-gradient(135deg, #1e3a5f 0%, #185FA5 100%)", borderRadius: "16px", padding: "32px 24px", color: "#fff", fontFamily: "Arial, sans-serif" }}>
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div style={{ fontSize: "20px", fontWeight: "700", marginBottom: "4px" }}>TURNOS DISPONIBLES</div>
                <div style={{ fontSize: "13px", color: "#85b7eb" }}>Terapia Visual</div>
                <div style={{ fontSize: "12px", color: "#b5d4f4", marginTop: "4px" }}>Simon Ponce</div>
              </div>
              {Object.keys(seleccionFinal).sort().map(fechaStr => {
                const horas = (seleccionFinal[fechaStr] || []).filter(h => !reservados[fechaStr + "_" + h]);
                if (horas.length === 0) return null;
                const fechaObj = new Date(fechaStr + "T00:00:00");
                return (
                  <div key={fechaStr} style={{ background: "rgba(255,255,255,0.1)", borderRadius: "10px", padding: "14px", marginBottom: "12px" }}>
                    <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>
                      {diasSemana[fechaObj.getDay()]} {fechaObj.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {horas.map(h => (
                        <span key={h} style={{ background: "#fff", color: "#1e3a5f", padding: "4px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "600" }}>{h}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
              <div style={{ textAlign: "center", marginTop: "20px", fontSize: "12px", color: "#e0ecfa" }}>
                Te envio una lista con los horarios disponibles.
              </div>
              <div style={{ textAlign: "center", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.2)", fontSize: "11px", color: "#85b7eb" }}>
                Optica Ponce — Terapia Visual
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button onClick={() => {
                const node = document.getElementById("imagen-horarios");
                import("html2canvas").then(html2canvas => {
                  html2canvas.default(node).then(canvas => {
                    const link = document.createElement("a");
                    link.download = "horarios-disponibles.png";
                    link.href = canvas.toDataURL();
                    link.click();
                  });
                });
              }} style={{ flex: 1, background: "#185FA5", color: "#fff", border: "none", borderRadius: "6px", padding: "10px", cursor: "pointer", fontSize: "13px" }}>
                Descargar imagen
              </button>
              <button onClick={() => setMostrarImagen(false)} style={{ background: "transparent", color: "#6b7a8f", border: "1px solid #dde3ec", borderRadius: "6px", padding: "10px 16px", cursor: "pointer", fontSize: "13px" }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}