"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter, useParams } from "next/navigation";

const formatGrad = (val) => {
  if (val === null || val === undefined || val === "") return "";
  const n = parseFloat(val);
  if (isNaN(n)) return "";
  const signo = n >= 0 ? "+" : "";
  return signo + n.toFixed(2).replace(".", ",");
};

const validarGrad = (val) => {
  if (val === "" || val === "+" || val === "-") return true;
  const limpio = val.replace(",", ".");
  const n = parseFloat(limpio);
  if (isNaN(n)) return false;
  return Math.round(n * 100) % 25 === 0;
};

const tdStyle = { padding: "6px 8px", border: "1px solid #dde3ec" };
const inpStyle = { width: "100%", padding: "4px 6px", border: "none", fontSize: "13px", outline: "none", minWidth: "60px", boxSizing: "border-box" };

function TdInput({ value, onChange }) {
  return <td style={tdStyle}><input value={value} onChange={onChange} style={inpStyle} /></td>;
}
function BtnOpc({ value, onChange, opciones }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {opciones.map(op => (
        <button key={op} type="button" onClick={() => onChange(op)} style={{ padding: "5px 12px", borderRadius: "20px", border: "1px solid", fontSize: "12px", cursor: "pointer", background: value === op ? "#185FA5" : "#f4f7fb", color: value === op ? "#fff" : "#1e3a5f", borderColor: value === op ? "#185FA5" : "#dde3ec" }}>
          {op}
        </button>
      ))}
    </div>
  );
}
function Seccion({ titulo, abierto, onToggle, children }) {
  return (
    <div style={{ border: "1px solid #dde3ec", borderRadius: "8px", marginBottom: "10px", overflow: "hidden" }}>
      <div onClick={onToggle} style={{ padding: "14px 20px", background: abierto ? "#E6F1FB" : "#fff", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "14px", fontWeight: "600", color: "#1e3a5f" }}>{titulo}</span>
        <span style={{ fontSize: "18px", color: "#185FA5" }}>{abierto ? "▲" : "▶"}</span>
      </div>
      {abierto && <div style={{ padding: "20px", background: "#fff", borderTop: "1px solid #dde3ec" }}>{children}</div>}
    </div>
  );
}
const lbl = (text) => <div style={{ fontSize: "11px", color: "#6b7a8f", marginBottom: "3px" }}>{text}</div>;

const SINTOMAS = ["Te pierdes al leer?", "Se te cansan los ojos?", "Saltas o lees lineas dos veces?", "Ves borroso?", "Dolor de cabeza?", "Eres lento al leer?", "Se mueven las palabras?", "Ves doble?"];

export default function EditarEvaluacion() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [error, setError] = useState("");
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [fecha, setFecha] = useState("");
  const [abiertos, setAbiertos] = useState({ datos: true, motivo: false, rx: false, anterior: false, posterior: false, eval1: false, sensorial: false, acomodativa: false, diagnostico: false });
  const [diagAbiertos, setDiagAbiertos] = useState({ vergencia: false, acomodativo: false, oculomotor: false, estrabismo: false, ambliopia: false, perceptual: false, lectura: false });
  const [form, setForm] = useState({
    antecedentes_personales: "", antecedentes_familiares: "", profesionales_involucrados: "",
    anamnesis: "", observaciones_motivo: "", objetivos_paciente: "",
    sintomas_lectura: [],
    rx_od_esfera: "", rx_od_cilindro: "", rx_od_eje: "", rx_od_prisma: "", rx_od_av_lejos: "",
    rx_oi_esfera: "", rx_oi_cilindro: "", rx_oi_eje: "", rx_oi_prisma: "", rx_oi_av_lejos: "", rx_ao_lejos: "",
    rx_od_esfera_cerca: "", rx_od_cilindro_cerca: "", rx_od_eje_cerca: "", rx_od_prisma_cerca: "", rx_od_av_cerca: "",
    rx_oi_esfera_cerca: "", rx_oi_cilindro_cerca: "", rx_oi_eje_cerca: "", rx_oi_prisma_cerca: "", rx_oi_av_cerca: "", rx_ao_cerca: "",
    obs_segmento_anterior: "", obs_segmento_posterior: "",
    dominancia_ocular: "", hirschberg: "", kappa_od: "", kappa_oi: "", ducciones: "", versiones: "",
    cover_sc_vl: "", cover_sc_vp40: "", cover_sc_vp20: "",
    cover_cc_vl: "", cover_cc_vp40: "", cover_cc_vp20: "",
    ppc_or: "", ppc_sf: "", ppc_cf: "",
    seg_calidad: "", seg_mov_cab: "", seg_tiempo: "", seg_cognitivo: "",
    sac_calidad: "", sac_mov_cab: "", sac_hipo_hiper: "", sac_tiempo: "",
    campo_visual: "", equilibrio: "", linea_media: "",
    ps: "", fusion_ldw: "", sensibilidad_contraste: "", estereopsis: "",
    aa_od: "", aa_od_av: "", aa_oi: "", aa_oi_av: "", aa_arn: "", aa_arn_av: "", aa_arp: "", aa_arp_av: "",
    flex_od_mon_cpm: "", flex_od_mon_falla: "", flex_oi_mon_cpm: "", flex_oi_mon_falla: "",
    flex_od_bin_cpm: "", flex_od_bin_falla: "",
    diagnostico_vergencia: "", diagnostico_acomodativo: "", diagnostico_oculomotor: "",
    diagnostico_estrabismo: "", diagnostico_ambliopia: "", diagnostico_perceptual: "",
    diagnostico_lectura: "", diagnostico_otros: "", notas_diagnostico: "", puntos_clave: "",
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.push("/"); return; }
      const { data: cl } = await supabase.from("clientes").select("id, nombre, apellido").order("apellido");
      if (cl) setClientes(cl);
      const { data: ev } = await supabase.from("evaluaciones_neurosensoriales").select("*").eq("id", params.id).single();
      if (ev) {
        setClienteId(ev.cliente_id || "");
        setFecha(ev.fecha || "");
        setForm({
          antecedentes_personales: ev.antecedentes_personales || "",
          antecedentes_familiares: ev.antecedentes_familiares || "",
          profesionales_involucrados: ev.profesionales_involucrados || "",
          anamnesis: ev.anamnesis || "",
          observaciones_motivo: ev.observaciones_motivo || "",
          objetivos_paciente: ev.objetivos_paciente || "",
          sintomas_lectura: ev.sintomas_lectura || [],
          rx_od_esfera: ev.rx_od_esfera !== null && ev.rx_od_esfera !== undefined ? formatGrad(ev.rx_od_esfera) : "",
          rx_od_cilindro: ev.rx_od_cilindro !== null && ev.rx_od_cilindro !== undefined ? formatGrad(ev.rx_od_cilindro) : "",
          rx_od_eje: ev.rx_od_eje ?? "",
          rx_od_prisma: ev.rx_od_prisma || "",
          rx_od_av_lejos: ev.rx_od_av_lejos || "",
          rx_oi_esfera: ev.rx_oi_esfera !== null && ev.rx_oi_esfera !== undefined ? formatGrad(ev.rx_oi_esfera) : "",
          rx_oi_cilindro: ev.rx_oi_cilindro !== null && ev.rx_oi_cilindro !== undefined ? formatGrad(ev.rx_oi_cilindro) : "",
          rx_oi_eje: ev.rx_oi_eje ?? "",
          rx_oi_prisma: ev.rx_oi_prisma || "",
          rx_oi_av_lejos: ev.rx_oi_av_lejos || "",
          rx_ao_lejos: ev.rx_ao_lejos || "",
          rx_od_esfera_cerca: ev.rx_od_esfera_cerca !== null && ev.rx_od_esfera_cerca !== undefined ? formatGrad(ev.rx_od_esfera_cerca) : "",
          rx_od_cilindro_cerca: ev.rx_od_cilindro_cerca !== null && ev.rx_od_cilindro_cerca !== undefined ? formatGrad(ev.rx_od_cilindro_cerca) : "",
          rx_od_eje_cerca: ev.rx_od_eje_cerca ?? "",
          rx_od_prisma_cerca: ev.rx_od_prisma_cerca || "",
          rx_od_av_cerca: ev.rx_od_av_cerca || "",
          rx_oi_esfera_cerca: ev.rx_oi_esfera_cerca !== null && ev.rx_oi_esfera_cerca !== undefined ? formatGrad(ev.rx_oi_esfera_cerca) : "",
          rx_oi_cilindro_cerca: ev.rx_oi_cilindro_cerca !== null && ev.rx_oi_cilindro_cerca !== undefined ? formatGrad(ev.rx_oi_cilindro_cerca) : "",
          rx_oi_eje_cerca: ev.rx_oi_eje_cerca ?? "",
          rx_oi_prisma_cerca: ev.rx_oi_prisma_cerca || "",
          rx_oi_av_cerca: ev.rx_oi_av_cerca || "",
          rx_ao_cerca: ev.rx_ao_cerca || "",
          obs_segmento_anterior: ev.obs_segmento_anterior || "",
          obs_segmento_posterior: ev.obs_segmento_posterior || "",
          dominancia_ocular: ev.dominancia_ocular || "",
          hirschberg: ev.hirschberg || "",
          kappa_od: ev.kappa_od || "",
          kappa_oi: ev.kappa_oi || "",
          ducciones: ev.ducciones || "",
          versiones: ev.versiones || "",
          cover_sc_vl: ev.cover_sc_vl || "",
          cover_sc_vp40: ev.cover_sc_vp40 || "",
          cover_sc_vp20: ev.cover_sc_vp20 || "",
          cover_cc_vl: ev.cover_cc_vl || "",
          cover_cc_vp40: ev.cover_cc_vp40 || "",
          cover_cc_vp20: ev.cover_cc_vp20 || "",
          ppc_or: ev.ppc_or || "",
          ppc_sf: ev.ppc_sf || "",
          ppc_cf: ev.ppc_cf || "",
          seg_calidad: ev.seg_calidad || "",
          seg_mov_cab: ev.seg_mov_cab || "",
          seg_tiempo: ev.seg_tiempo || "",
          seg_cognitivo: ev.seg_cognitivo || "",
          sac_calidad: ev.sac_calidad || "",
          sac_mov_cab: ev.sac_mov_cab || "",
          sac_hipo_hiper: ev.sac_hipo_hiper || "",
          sac_tiempo: ev.sac_tiempo || "",
          campo_visual: ev.campo_visual || "",
          equilibrio: ev.equilibrio || "",
          linea_media: ev.linea_media || "",
          ps: ev.ps || "",
          fusion_ldw: ev.fusion_ldw || "",
          sensibilidad_contraste: ev.sensibilidad_contraste || "",
          estereopsis: ev.estereopsis || "",
          aa_od: ev.aa_od || "",
          aa_od_av: ev.aa_od_av || "",
          aa_oi: ev.aa_oi || "",
          aa_oi_av: ev.aa_oi_av || "",
          aa_arn: ev.aa_arn || "",
          aa_arn_av: ev.aa_arn_av || "",
          aa_arp: ev.aa_arp || "",
          aa_arp_av: ev.aa_arp_av || "",
          flex_od_mon_cpm: ev.flex_od_mon_cpm || "",
          flex_od_mon_falla: ev.flex_od_mon_falla || "",
          flex_oi_mon_cpm: ev.flex_oi_mon_cpm || "",
          flex_oi_mon_falla: ev.flex_oi_mon_falla || "",
          flex_od_bin_cpm: ev.flex_od_bin_cpm || "",
          flex_od_bin_falla: ev.flex_od_bin_falla || "",
          diagnostico_vergencia: ev.diagnostico_vergencia || "",
          diagnostico_acomodativo: ev.diagnostico_acomodativo || "",
          diagnostico_oculomotor: ev.diagnostico_oculomotor || "",
          diagnostico_estrabismo: ev.diagnostico_estrabismo || "",
          diagnostico_ambliopia: ev.diagnostico_ambliopia || "",
          diagnostico_perceptual: ev.diagnostico_perceptual || "",
          diagnostico_lectura: ev.diagnostico_lectura || "",
          diagnostico_otros: ev.diagnostico_otros || "",
          notas_diagnostico: ev.notas_diagnostico || "",
          puntos_clave: ev.puntos_clave || "",
        });
      }
      setLoadingDatos(false);
    };
    checkUser();
  }, []);

  const set = (name, value) => setForm(prev => ({ ...prev, [name]: value }));
  const toggle = (key) => setAbiertos(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleDiag = (key) => setDiagAbiertos(prev => ({ ...prev, [key]: !prev[key] }));

  const toggleSintoma = (sintoma) => {
    setForm(prev => {
      const actuales = prev.sintomas_lectura || [];
      const yaEsta = actuales.includes(sintoma);
      return { ...prev, sintomas_lectura: yaEsta ? actuales.filter(s => s !== sintoma) : [...actuales, sintoma] };
    });
  };

  const onGradChange = (name, val) => {
    if (/^[+-]?\d{0,2}([.,]\d{0,2})?$/.test(val) || val === "" || val === "+" || val === "-") set(name, val);
  };
  const onGradBlur = (name, val) => {
    if (val === "" || val === "+" || val === "-") return;
    if (!validarGrad(val)) { alert("Valor invalido. Use incrementos de 0,25"); set(name, ""); return; }
    set(name, formatGrad(parseFloat(val.replace(",", "."))));
  };
  const onEjeChange = (name, val) => {
    if (val === "" || (/^\d+$/.test(val) && parseInt(val) >= 0 && parseInt(val) <= 180)) set(name, val);
  };

  const handleGuardar = async () => {
    setLoading(true);
    const datos = { ...form, fecha };
    if (clienteId && clienteId !== "") datos.cliente_id = clienteId;
    else delete datos.cliente_id;
    ["rx_od_esfera", "rx_od_cilindro", "rx_oi_esfera", "rx_oi_cilindro", "rx_od_esfera_cerca", "rx_od_cilindro_cerca", "rx_oi_esfera_cerca", "rx_oi_cilindro_cerca"].forEach(c => {
      if (datos[c] !== "") datos[c] = parseFloat(String(datos[c]).replace(",", ".")) || null;
      else datos[c] = null;
    });
    ["rx_od_eje", "rx_oi_eje", "rx_od_eje_cerca", "rx_oi_eje_cerca"].forEach(c => {
      if (datos[c] !== "") datos[c] = parseInt(datos[c]) || null;
      else datos[c] = null;
    });
    const { error } = await supabase.from("evaluaciones_neurosensoriales").update(datos).eq("id", params.id);
    if (error) { setError("Error al guardar: " + error.message); setLoading(false); }
    else { router.push("/neurosensorial"); }
  };

  const handleEliminar = async () => {
    if (!confirm("Estas seguro que queres eliminar esta evaluacion?")) return;
    await supabase.from("evaluaciones_neurosensoriales").delete().eq("id", params.id);
    router.push("/neurosensorial");
  };

  const inp = (name, placeholder) => (
    <input value={form[name]} onChange={(e) => set(name, e.target.value)} placeholder={placeholder || ""} style={{ width: "100%", padding: "6px 10px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }} />
  );
  const ta = (name, rows) => (
    <textarea value={form[name]} onChange={(e) => set(name, e.target.value)} rows={rows || 3} style={{ padding: "8px 10px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "13px", width: "100%", boxSizing: "border-box", resize: "vertical" }} />
  );
  const gradBox = (name, placeholder) => (
    <input value={form[name]} onChange={(e) => onGradChange(name, e.target.value)} onBlur={(e) => onGradBlur(name, e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: "6px 8px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", textAlign: "center" }} />
  );
  const ejeBox = (name) => (
    <input value={form[name]} onChange={(e) => onEjeChange(name, e.target.value)} placeholder="0-180" style={{ width: "100%", padding: "6px 8px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", textAlign: "center" }} />
  );
  const simpleBox = (name, placeholder) => (
    <input value={form[name]} onChange={(e) => set(name, e.target.value)} placeholder={placeholder || ""} style={{ width: "100%", padding: "6px 8px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", textAlign: "center" }} />
  );

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

  if (loadingDatos) return <div style={{ padding: "40px", color: "#6b7a8f" }}>Cargando...</div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f7fb" }}>
      <div style={{ width: "220px", background: "#1e3a5f", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid #2a4f7a" }}>
          <div style={{ fontSize: "16px", fontWeight: "600", color: "#fff" }}>Optica Ponce</div>
          <div style={{ fontSize: "12px", color: "#85b7eb", marginTop: "2px" }}>Sistema de gestion</div>
        </div>
        <div style={{ flex: 1, padding: "10px 0" }}>
          {menuItems.map(item => (
            <div key={item.path} onClick={() => router.push(item.path)} style={{ padding: "11px 20px", color: item.path === "/neurosensorial" ? "#fff" : "#b5d4f4", background: item.path === "/neurosensorial" ? "#185FA5" : "transparent", cursor: "pointer", fontSize: "14px" }}>
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
          <span style={{ fontSize: "15px", fontWeight: "600", color: "#1e3a5f" }}>Editar Evaluacion Neurosensorial</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" onClick={handleGuardar} disabled={loading} style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontSize: "13px" }}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
            <button type="button" onClick={handleEliminar} style={{ background: "#FCEBEB", color: "#A32D2D", border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontSize: "13px" }}>
              Eliminar
            </button>
            <button type="button" onClick={() => router.push("/neurosensorial")} style={{ background: "transparent", color: "#6b7a8f", border: "1px solid #dde3ec", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontSize: "13px" }}>
              Volver
            </button>
          </div>
        </div>

        <div style={{ padding: "24px", maxWidth: "900px" }}>
          {error && <div style={{ background: "#FCEBEB", color: "#A32D2D", padding: "10px 14px", borderRadius: "6px", marginBottom: "16px", fontSize: "13px" }}>{error}</div>}

          <Seccion titulo="Datos Generales" abierto={abiertos.datos} onToggle={() => toggle("datos")}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div>
                {lbl("Paciente")}
                <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", background: "#fff" }}>
                  <option value="">Seleccionar paciente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.apellido}, {c.nombre}</option>)}
                </select>
              </div>
              <div>
                {lbl("Fecha")}
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div>{lbl("Antecedentes personales")}{ta("antecedentes_personales", 2)}</div>
              <div>{lbl("Antecedentes familiares")}{ta("antecedentes_familiares", 2)}</div>
            </div>
            <div>{lbl("Profesionales involucrados")}{inp("profesionales_involucrados")}</div>
          </Seccion>

          <Seccion titulo="Motivo de Consulta" abierto={abiertos.motivo} onToggle={() => toggle("motivo")}>
            <div style={{ marginBottom: "14px" }}>{lbl("Anamnesis")}{ta("anamnesis", 4)}</div>
            <div style={{ marginBottom: "14px" }}>{lbl("Observaciones")}{ta("observaciones_motivo", 3)}</div>
            <div style={{ marginBottom: "14px" }}>{lbl("Objetivos del paciente")}{ta("objetivos_paciente", 3)}</div>
            <div>
              {lbl("Sintomas de lectura")}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "4px" }}>
                {SINTOMAS.map(sintoma => (
                  <label key={sintoma} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "20px", border: "1px solid #dde3ec", fontSize: "13px", cursor: "pointer", background: (form.sintomas_lectura || []).includes(sintoma) ? "#E6F1FB" : "#fff", color: (form.sintomas_lectura || []).includes(sintoma) ? "#185FA5" : "#1e3a5f" }}>
                    <input type="checkbox" checked={(form.sintomas_lectura || []).includes(sintoma)} onChange={() => toggleSintoma(sintoma)} style={{ cursor: "pointer" }} />
                    {sintoma}
                  </label>
                ))}
              </div>
            </div>
          </Seccion>

          <Seccion titulo="Rx y AV" abierto={abiertos.rx} onToggle={() => toggle("rx")}>
            <div style={{ borderBottom: "1px solid #f0f2f5", paddingBottom: "16px", marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f", marginBottom: "12px" }}>Lejos</div>
              <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 1fr 1fr 1fr", gap: "8px", alignItems: "end", marginBottom: "8px" }}>
                    <div style={{ fontSize: "12px", color: "#6b7a8f", fontWeight: "600", paddingBottom: "8px" }}>OD</div>
                    <div>{lbl("Esfera")}{gradBox("rx_od_esfera", "+0,00")}</div>
                    <div>{lbl("Cilindro")}{gradBox("rx_od_cilindro", "+0,00")}</div>
                    <div>{lbl("Eje")}{ejeBox("rx_od_eje")}</div>
                    <div>{lbl("Δ")}{simpleBox("rx_od_prisma")}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 1fr 1fr 1fr", gap: "8px", alignItems: "end" }}>
                    <div style={{ fontSize: "12px", color: "#6b7a8f", fontWeight: "600", paddingBottom: "8px" }}>OI</div>
                    <div>{lbl("Esfera")}{gradBox("rx_oi_esfera", "+0,00")}</div>
                    <div>{lbl("Cilindro")}{gradBox("rx_oi_cilindro", "+0,00")}</div>
                    <div>{lbl("Eje")}{ejeBox("rx_oi_eje")}</div>
                    <div>{lbl("Δ")}{simpleBox("rx_oi_prisma")}</div>
                  </div>
                </div>
                <div style={{ width: "1px", background: "#f0f2f5", margin: "0 4px" }}></div>
                <div style={{ width: "80px", display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
                  <div>{lbl("AV OD")}{simpleBox("rx_od_av_lejos", "0/0")}</div>
                  <div style={{ marginTop: "4px" }}>{lbl("AV AO")}{simpleBox("rx_ao_lejos", "0/0")}</div>
                  <div style={{ marginTop: "4px" }}>{lbl("AV OI")}{simpleBox("rx_oi_av_lejos", "0/0")}</div>
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f", marginBottom: "12px" }}>Cerca</div>
              <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 1fr 1fr 1fr", gap: "8px", alignItems: "end", marginBottom: "8px" }}>
                    <div style={{ fontSize: "12px", color: "#6b7a8f", fontWeight: "600", paddingBottom: "8px" }}>OD</div>
                    <div>{lbl("Esfera")}{gradBox("rx_od_esfera_cerca", "+0,00")}</div>
                    <div>{lbl("Cilindro")}{gradBox("rx_od_cilindro_cerca", "+0,00")}</div>
                    <div>{lbl("Eje")}{ejeBox("rx_od_eje_cerca")}</div>
                    <div>{lbl("Δ")}{simpleBox("rx_od_prisma_cerca")}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 1fr 1fr 1fr", gap: "8px", alignItems: "end" }}>
                    <div style={{ fontSize: "12px", color: "#6b7a8f", fontWeight: "600", paddingBottom: "8px" }}>OI</div>
                    <div>{lbl("Esfera")}{gradBox("rx_oi_esfera_cerca", "+0,00")}</div>
                    <div>{lbl("Cilindro")}{gradBox("rx_oi_cilindro_cerca", "+0,00")}</div>
                    <div>{lbl("Eje")}{ejeBox("rx_oi_eje_cerca")}</div>
                    <div>{lbl("Δ")}{simpleBox("rx_oi_prisma_cerca")}</div>
                  </div>
                </div>
                <div style={{ width: "1px", background: "#f0f2f5", margin: "0 4px" }}></div>
                <div style={{ width: "80px", display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
                  <div>{lbl("AV OD")}{simpleBox("rx_od_av_cerca", "0/0")}</div>
                  <div style={{ marginTop: "4px" }}>{lbl("AV AO")}{simpleBox("rx_ao_cerca", "0/0")}</div>
                  <div style={{ marginTop: "4px" }}>{lbl("AV OI")}{simpleBox("rx_oi_av_cerca", "0/0")}</div>
                </div>
              </div>
            </div>
          </Seccion>

          <Seccion titulo="Salud Ocular del Segmento Anterior" abierto={abiertos.anterior} onToggle={() => toggle("anterior")}>
            <div>{lbl("Observaciones")}{ta("obs_segmento_anterior", 4)}</div>
          </Seccion>

          <Seccion titulo="Salud Ocular del Segmento Posterior" abierto={abiertos.posterior} onToggle={() => toggle("posterior")}>
            <div>{lbl("Observaciones")}{ta("obs_segmento_posterior", 4)}</div>
          </Seccion>

          <Seccion titulo="Evaluacion Primera Parte" abierto={abiertos.eval1} onToggle={() => toggle("eval1")}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "16px" }}>
              <div>{lbl("Dominancia ocular")}{inp("dominancia_ocular")}</div>
              <div>{lbl("Hirschberg")}{inp("hirschberg")}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>{lbl("Kappa OD")}{inp("kappa_od")}</div>
                <div>{lbl("Kappa OI")}{inp("kappa_oi")}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
              <div>{lbl("Ducciones")}{inp("ducciones")}</div>
              <div>{lbl("Versiones")}{inp("versiones")}</div>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#1e3a5f", marginBottom: "8px" }}>Cover Test</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f4f7fb" }}>
                    <th style={{ padding: "8px 12px", border: "1px solid #dde3ec", textAlign: "left", fontWeight: "600", color: "#1e3a5f" }}>Cover Test</th>
                    <th style={{ padding: "8px 12px", border: "1px solid #dde3ec", textAlign: "center", fontWeight: "500", color: "#6b7a8f" }}>VL 6mts</th>
                    <th style={{ padding: "8px 12px", border: "1px solid #dde3ec", textAlign: "center", fontWeight: "500", color: "#6b7a8f" }}>VP 40cm</th>
                    <th style={{ padding: "8px 12px", border: "1px solid #dde3ec", textAlign: "center", fontWeight: "500", color: "#6b7a8f" }}>VP 20cm</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "8px 12px", border: "1px solid #dde3ec", fontWeight: "600", color: "#1e3a5f" }}>SC</td>
                    <TdInput value={form.cover_sc_vl} onChange={(e) => set("cover_sc_vl", e.target.value)} />
                    <TdInput value={form.cover_sc_vp40} onChange={(e) => set("cover_sc_vp40", e.target.value)} />
                    <TdInput value={form.cover_sc_vp20} onChange={(e) => set("cover_sc_vp20", e.target.value)} />
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 12px", border: "1px solid #dde3ec", fontWeight: "600", color: "#1e3a5f" }}>CC</td>
                    <TdInput value={form.cover_cc_vl} onChange={(e) => set("cover_cc_vl", e.target.value)} />
                    <TdInput value={form.cover_cc_vp40} onChange={(e) => set("cover_cc_vp40", e.target.value)} />
                    <TdInput value={form.cover_cc_vp20} onChange={(e) => set("cover_cc_vp20", e.target.value)} />
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#1e3a5f", marginBottom: "8px" }}>PPC</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
                <div>{lbl("OR")}{inp("ppc_or", "__ / __")}</div>
                <div>{lbl("SF")}{inp("ppc_sf", "__ / __")}</div>
                <div>{lbl("CF")}{inp("ppc_cf", "__ / __")}</div>
              </div>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#1e3a5f", marginBottom: "10px" }}>Seguimientos</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "14px" }}>
                <div>{lbl("Calidad")}<BtnOpc value={form.seg_calidad} onChange={(v) => set("seg_calidad", v)} opciones={["1", "2", "3", "4"]} /></div>
                <div>{lbl("Mov. de cabeza")}<BtnOpc value={form.seg_mov_cab} onChange={(v) => set("seg_mov_cab", v)} opciones={["1", "2", "3", "4"]} /></div>
                <div>{lbl("Tiempo")}<BtnOpc value={form.seg_tiempo} onChange={(v) => set("seg_tiempo", v)} opciones={["\u2193", "\u2191", "="]} /></div>
                <div>{lbl("Cognitivo")}<BtnOpc value={form.seg_cognitivo} onChange={(v) => set("seg_cognitivo", v)} opciones={["1", "2", "3", "4"]} /></div>
              </div>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#1e3a5f", marginBottom: "10px" }}>Sacadicos</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "14px" }}>
                <div>{lbl("Calidad")}<BtnOpc value={form.sac_calidad} onChange={(v) => set("sac_calidad", v)} opciones={["1", "2", "3", "4"]} /></div>
                <div>{lbl("Mov. de cabeza")}<BtnOpc value={form.sac_mov_cab} onChange={(v) => set("sac_mov_cab", v)} opciones={["1", "2", "3", "4"]} /></div>
                <div>{lbl("Hipo/Hiper")}<BtnOpc value={form.sac_hipo_hiper} onChange={(v) => set("sac_hipo_hiper", v)} opciones={["HIPO", "HIPER", "-"]} /></div>
                <div>{lbl("Tiempo")}<BtnOpc value={form.sac_tiempo} onChange={(v) => set("sac_tiempo", v)} opciones={["\u2193", "\u2191", "="]} /></div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
              <div>{lbl("Campo visual")}<BtnOpc value={form.campo_visual} onChange={(v) => set("campo_visual", v)} opciones={["Correcto AO", "Trabajar OI", "Trabajar OD"]} /></div>
              <div>{lbl("Equilibrio")}<BtnOpc value={form.equilibrio} onChange={(v) => set("equilibrio", v)} opciones={["Correcto", "Presenta dificultad"]} /></div>
              <div>{lbl("Linea media")}<BtnOpc value={form.linea_media} onChange={(v) => set("linea_media", v)} opciones={["Correcta", "Desplaz Der", "Desplaz Izq", "Desplaz Arriba", "Desplaz Abajo"]} /></div>
            </div>
          </Seccion>

          <Seccion titulo="Evaluacion Sensorial" abierto={abiertos.sensorial} onToggle={() => toggle("sensorial")}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div>{lbl("PS")}<BtnOpc value={form.ps} onChange={(v) => set("ps", v)} opciones={["Presente", "Ausente"]} /></div>
              <div>{lbl("Fusion LDW")}<BtnOpc value={form.fusion_ldw} onChange={(v) => set("fusion_ldw", v)} opciones={["Fusion", "Supresion OD", "Supresion OI", "Supresion alternante", "Diplopia horizontal cruzada", "Diplopia horizontal homonima", "Diplopia vertical", "Respuesta variable", "No concluyente"]} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>{lbl("Sensibilidad al contraste")}{inp("sensibilidad_contraste")}</div>
              <div>{lbl("Estereopsis")}{inp("estereopsis")}</div>
            </div>
          </Seccion>

          <Seccion titulo="Evaluacion Acomodativa" abierto={abiertos.acomodativa} onToggle={() => toggle("acomodativa")}>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#1e3a5f", marginBottom: "8px" }}>AA Donders</div>
              <table style={{ width: "60%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f4f7fb" }}>
                    <th style={{ padding: "6px 12px", border: "1px solid #dde3ec", fontWeight: "500", color: "#6b7a8f" }}>AA</th>
                    <th style={{ padding: "6px 12px", border: "1px solid #dde3ec", fontWeight: "500", color: "#6b7a8f" }}>Donders</th>
                    <th style={{ padding: "6px 12px", border: "1px solid #dde3ec", fontWeight: "500", color: "#6b7a8f" }}>AV</th>
                  </tr>
                </thead>
                <tbody>
                  {[["OD", "aa_od", "aa_od_av"], ["OI", "aa_oi", "aa_oi_av"], ["ARN", "aa_arn", "aa_arn_av"], ["ARP", "aa_arp", "aa_arp_av"]].map(([label, campo, campoAv]) => (
                    <tr key={label}>
                      <td style={{ padding: "6px 12px", border: "1px solid #dde3ec", fontWeight: "600", color: "#1e3a5f" }}>{label}</td>
                      <TdInput value={form[campo]} onChange={(e) => set(campo, e.target.value)} />
                      <TdInput value={form[campoAv]} onChange={(e) => set(campoAv, e.target.value)} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#1e3a5f", marginBottom: "8px" }}>Flexibilidad</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f4f7fb" }}>
                    <th style={{ padding: "6px 10px", border: "1px solid #dde3ec", fontWeight: "500", color: "#6b7a8f" }}>Flexibilidad</th>
                    <th style={{ padding: "6px 10px", border: "1px solid #dde3ec", fontWeight: "500", color: "#6b7a8f" }}>Mon +/- Dpts (cpm)</th>
                    <th style={{ padding: "6px 10px", border: "1px solid #dde3ec", fontWeight: "500", color: "#6b7a8f" }}>Falla con</th>
                    <th style={{ padding: "6px 10px", border: "1px solid #dde3ec", fontWeight: "500", color: "#6b7a8f" }}>Bin +/- Dpts (cpm)</th>
                    <th style={{ padding: "6px 10px", border: "1px solid #dde3ec", fontWeight: "500", color: "#6b7a8f" }}>Falla con</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "6px 10px", border: "1px solid #dde3ec", fontWeight: "600", color: "#1e3a5f" }}>OD</td>
                    <TdInput value={form.flex_od_mon_cpm} onChange={(e) => set("flex_od_mon_cpm", e.target.value)} />
                    <TdInput value={form.flex_od_mon_falla} onChange={(e) => set("flex_od_mon_falla", e.target.value)} />
                    <TdInput value={form.flex_od_bin_cpm} onChange={(e) => set("flex_od_bin_cpm", e.target.value)} />
                    <TdInput value={form.flex_od_bin_falla} onChange={(e) => set("flex_od_bin_falla", e.target.value)} />
                  </tr>
                  <tr>
                    <td style={{ padding: "6px 10px", border: "1px solid #dde3ec", fontWeight: "600", color: "#1e3a5f" }}>OI</td>
                    <TdInput value={form.flex_oi_mon_cpm} onChange={(e) => set("flex_oi_mon_cpm", e.target.value)} />
                    <TdInput value={form.flex_oi_mon_falla} onChange={(e) => set("flex_oi_mon_falla", e.target.value)} />
                    <td colSpan={2} style={{ border: "1px solid #dde3ec" }}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Seccion>

          <Seccion titulo="Diagnostico" abierto={abiertos.diagnostico} onToggle={() => toggle("diagnostico")}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

              <div style={{ border: "1px solid #dde3ec", borderRadius: "8px", overflow: "hidden" }}>
                <div onClick={() => toggleDiag("vergencia")} style={{ padding: "12px 16px", background: diagAbiertos.vergencia ? "#f4f7fb" : "#fff", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f" }}>Vergencia {form.diagnostico_vergencia && "— " + form.diagnostico_vergencia}</span>
                  <span style={{ fontSize: "14px", color: "#185FA5" }}>{diagAbiertos.vergencia ? "▲" : "▶"}</span>
                </div>
                {diagAbiertos.vergencia && (
                  <div style={{ padding: "14px 16px", borderTop: "1px solid #f0f2f5" }}>
                    <BtnOpc value={form.diagnostico_vergencia} onChange={(v) => set("diagnostico_vergencia", v)} opciones={["Insuficiencia de convergencia (IC)", "Exceso de convergencia (EC)", "Insuficiencia de divergencia (ID)", "Exceso de divergencia (ED)"]} />
                  </div>
                )}
              </div>

              <div style={{ border: "1px solid #dde3ec", borderRadius: "8px", overflow: "hidden" }}>
                <div onClick={() => toggleDiag("acomodativo")} style={{ padding: "12px 16px", background: diagAbiertos.acomodativo ? "#f4f7fb" : "#fff", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f" }}>Acomodativas {form.diagnostico_acomodativo && "— " + form.diagnostico_acomodativo}</span>
                  <span style={{ fontSize: "14px", color: "#185FA5" }}>{diagAbiertos.acomodativo ? "▲" : "▶"}</span>
                </div>
                {diagAbiertos.acomodativo && (
                  <div style={{ padding: "14px 16px", borderTop: "1px solid #f0f2f5" }}>
                    <BtnOpc value={form.diagnostico_acomodativo} onChange={(v) => set("diagnostico_acomodativo", v)} opciones={["Insuficiencia acomodativa", "Exceso acomodativo", "Espasmo", "Pseudomiopia", "Inflexibilidad acomodativa", "Fatiga acomodativa"]} />
                  </div>
                )}
              </div>

              <div style={{ border: "1px solid #dde3ec", borderRadius: "8px", overflow: "hidden" }}>
                <div onClick={() => toggleDiag("oculomotor")} style={{ padding: "12px 16px", background: diagAbiertos.oculomotor ? "#f4f7fb" : "#fff", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f" }}>Oculomotoras {form.diagnostico_oculomotor && "— " + form.diagnostico_oculomotor}</span>
                  <span style={{ fontSize: "14px", color: "#185FA5" }}>{diagAbiertos.oculomotor ? "▲" : "▶"}</span>
                </div>
                {diagAbiertos.oculomotor && (
                  <div style={{ padding: "14px 16px", borderTop: "1px solid #f0f2f5" }}>
                    <BtnOpc value={form.diagnostico_oculomotor} onChange={(v) => set("diagnostico_oculomotor", v)} opciones={["Disfuncion de sacadicos", "Disfuncion de seguimientos", "Disfuncion de fijacion", "Nistagmo latente", "Nistagmo manifiesto"]} />
                  </div>
                )}
              </div>

              <div style={{ border: "1px solid #dde3ec", borderRadius: "8px", overflow: "hidden" }}>
                <div onClick={() => toggleDiag("estrabismo")} style={{ padding: "12px 16px", background: diagAbiertos.estrabismo ? "#f4f7fb" : "#fff", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f" }}>Estrabismos {form.diagnostico_estrabismo && "— " + form.diagnostico_estrabismo}</span>
                  <span style={{ fontSize: "14px", color: "#185FA5" }}>{diagAbiertos.estrabismo ? "▲" : "▶"}</span>
                </div>
                {diagAbiertos.estrabismo && (
                  <div style={{ padding: "14px 16px", borderTop: "1px solid #f0f2f5" }}>
                    <BtnOpc value={form.diagnostico_estrabismo} onChange={(v) => set("diagnostico_estrabismo", v)} opciones={["Endotropia constante", "Endotropia intermitente", "Exotropia constante", "Exotropia intermitente", "Hipertropia", "Hipotropia", "Microtropia"]} />
                  </div>
                )}
              </div>

              <div style={{ border: "1px solid #dde3ec", borderRadius: "8px", overflow: "hidden" }}>
                <div onClick={() => toggleDiag("ambliopia")} style={{ padding: "12px 16px", background: diagAbiertos.ambliopia ? "#f4f7fb" : "#fff", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f" }}>Ambliopia {form.diagnostico_ambliopia && "— " + form.diagnostico_ambliopia}</span>
                  <span style={{ fontSize: "14px", color: "#185FA5" }}>{diagAbiertos.ambliopia ? "▲" : "▶"}</span>
                </div>
                {diagAbiertos.ambliopia && (
                  <div style={{ padding: "14px 16px", borderTop: "1px solid #f0f2f5" }}>
                    <BtnOpc value={form.diagnostico_ambliopia} onChange={(v) => set("diagnostico_ambliopia", v)} opciones={["Ambliopia refractiva anisometropica", "Ambliopia refractiva isoametropica", "Ambliopia estrabica", "Ambliopia mixta", "Ambliopia por deprivacion"]} />
                  </div>
                )}
              </div>

              <div style={{ border: "1px solid #dde3ec", borderRadius: "8px", overflow: "hidden" }}>
                <div onClick={() => toggleDiag("perceptual")} style={{ padding: "12px 16px", background: diagAbiertos.perceptual ? "#f4f7fb" : "#fff", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f" }}>Perceptual / Procesamiento visual {form.diagnostico_perceptual && "— " + form.diagnostico_perceptual}</span>
                  <span style={{ fontSize: "14px", color: "#185FA5" }}>{diagAbiertos.perceptual ? "▲" : "▶"}</span>
                </div>
                {diagAbiertos.perceptual && (
                  <div style={{ padding: "14px 16px", borderTop: "1px solid #f0f2f5" }}>
                    <BtnOpc value={form.diagnostico_perceptual} onChange={(v) => set("diagnostico_perceptual", v)} opciones={["Disfuncion de memoria visual", "Disfuncion de cierre visual", "Disfuncion de discriminacion figura-fondo", "Disfuncion de relaciones espaciales", "Disfuncion de integracion visomotora", "Lentitud de procesamiento visual"]} />
                  </div>
                )}
              </div>

              <div style={{ border: "1px solid #dde3ec", borderRadius: "8px", overflow: "hidden" }}>
                <div onClick={() => toggleDiag("lectura")} style={{ padding: "12px 16px", background: diagAbiertos.lectura ? "#f4f7fb" : "#fff", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f" }}>Lectura {form.diagnostico_lectura && "— " + form.diagnostico_lectura}</span>
                  <span style={{ fontSize: "14px", color: "#185FA5" }}>{diagAbiertos.lectura ? "▲" : "▶"}</span>
                </div>
                {diagAbiertos.lectura && (
                  <div style={{ padding: "14px 16px", borderTop: "1px solid #f0f2f5" }}>
                    <BtnOpc value={form.diagnostico_lectura} onChange={(v) => set("diagnostico_lectura", v)} opciones={["Velocidad lectora baja", "Exceso de regresiones", "Perdida de linea"]} />
                  </div>
                )}
              </div>

              <div style={{ marginTop: "6px" }}>{lbl("Otros / Mixtos")}{inp("diagnostico_otros")}</div>
              <div>{lbl("Notas del diagnostico")}{ta("notas_diagnostico", 3)}</div>
              <div>{lbl("Puntos clave a trabajar en terapia")}{ta("puntos_clave", 3)}</div>

              {(form.diagnostico_vergencia || form.diagnostico_acomodativo || form.diagnostico_oculomotor || form.diagnostico_estrabismo || form.diagnostico_ambliopia || form.diagnostico_perceptual || form.diagnostico_lectura || form.diagnostico_otros) && (
                <div style={{ background: "#E6F1FB", borderRadius: "8px", padding: "16px", marginTop: "10px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#185FA5", marginBottom: "10px" }}>Resumen del diagnostico</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
                    {form.diagnostico_vergencia && <div><span style={{ color: "#6b7a8f" }}>Vergencia: </span><span style={{ color: "#1e3a5f", fontWeight: "500" }}>{form.diagnostico_vergencia}</span></div>}
                    {form.diagnostico_acomodativo && <div><span style={{ color: "#6b7a8f" }}>Acomodativas: </span><span style={{ color: "#1e3a5f", fontWeight: "500" }}>{form.diagnostico_acomodativo}</span></div>}
                    {form.diagnostico_oculomotor && <div><span style={{ color: "#6b7a8f" }}>Oculomotoras: </span><span style={{ color: "#1e3a5f", fontWeight: "500" }}>{form.diagnostico_oculomotor}</span></div>}
                    {form.diagnostico_estrabismo && <div><span style={{ color: "#6b7a8f" }}>Estrabismos: </span><span style={{ color: "#1e3a5f", fontWeight: "500" }}>{form.diagnostico_estrabismo}</span></div>}
                    {form.diagnostico_ambliopia && <div><span style={{ color: "#6b7a8f" }}>Ambliopia: </span><span style={{ color: "#1e3a5f", fontWeight: "500" }}>{form.diagnostico_ambliopia}</span></div>}
                    {form.diagnostico_perceptual && <div><span style={{ color: "#6b7a8f" }}>Perceptual: </span><span style={{ color: "#1e3a5f", fontWeight: "500" }}>{form.diagnostico_perceptual}</span></div>}
                    {form.diagnostico_lectura && <div><span style={{ color: "#6b7a8f" }}>Lectura: </span><span style={{ color: "#1e3a5f", fontWeight: "500" }}>{form.diagnostico_lectura}</span></div>}
                    {form.diagnostico_otros && <div><span style={{ color: "#6b7a8f" }}>Otros: </span><span style={{ color: "#1e3a5f", fontWeight: "500" }}>{form.diagnostico_otros}</span></div>}
                  </div>
                </div>
              )}
            </div>
          </Seccion>

          <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
            <button type="button" onClick={handleGuardar} disabled={loading} style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: "6px", padding: "12px 28px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}