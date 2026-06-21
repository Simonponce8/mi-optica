"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter, useParams } from "next/navigation";

export default function DetalleCuentaCorriente() {
  const router = useRouter();
  const params = useParams();
  const [ficha, setFicha] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [montoPago, setMontoPago] = useState("");
  const [obsPago, setObsPago] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.push("/"); return; }
      cargarDatos();
    };
    checkUser();
  }, []);

  const cargarDatos = async () => {
    const { data: f } = await supabase
      .from("fichas_opticas")
      .select("*, clientes(nombre, apellido)")
      .eq("id", params.id)
      .single();
    if (f) setFicha(f);
    const { data: p } = await supabase
      .from("pagos")
      .select("*")
      .eq("ficha_id", params.id)
      .order("created_at", { ascending: true });
    if (p) setPagos(p);
    setLoading(false);
  };

  const registrarPago = async () => {
    if (!montoPago || parseFloat(montoPago) <= 0) {
      setError("Ingresa un monto valido");
      return;
    }
    setGuardando(true);
    setError("");
    const nuevaSena = (parseFloat(ficha.sena) || 0) + parseFloat(montoPago);
    await supabase.from("pagos").insert([{
      ficha_id: params.id,
      monto: parseFloat(montoPago),
      fecha: new Date().toISOString().split("T")[0],
      observaciones: obsPago,
    }]);
    await supabase.from("fichas_opticas").update({ sena: nuevaSena }).eq("id", params.id);
    setMontoPago("");
    setObsPago("");
    setGuardando(false);
    cargarDatos();
  };

  if (loading) return <div style={{ padding: "40px", color: "#6b7a8f" }}>Cargando...</div>;
  if (!ficha) return <div style={{ padding: "40px", color: "#6b7a8f" }}>Ficha no encontrada</div>;

  const saldo = (ficha.monto_total || 0) - (ficha.sena || 0);
  const pagado = saldo <= 0;
  const totalPagado = pagos.reduce((acc, p) => acc + p.monto, 0);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f7fb" }}>
      <div style={{ width: "220px", background: "#1e3a5f", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid #2a4f7a" }}>
          <div style={{ fontSize: "16px", fontWeight: "600", color: "#fff" }}>Optica Ponce</div>
          <div style={{ fontSize: "12px", color: "#85b7eb", marginTop: "2px" }}>Sistema de gestion</div>
        </div>
        <div style={{ flex: 1, padding: "10px 0" }}>
          <div onClick={() => router.push("/dashboard")} style={{ padding: "11px 20px", color: "#b5d4f4", cursor: "pointer", fontSize: "14px" }}>Inicio</div>
          <div onClick={() => router.push("/clientes")} style={{ padding: "11px 20px", color: "#b5d4f4", cursor: "pointer", fontSize: "14px" }}>Clientes</div>
          <div onClick={() => router.push("/fichas")} style={{ padding: "11px 20px", color: "#b5d4f4", cursor: "pointer", fontSize: "14px" }}>Fichas opticas</div>
          <div onClick={() => router.push("/ventas")} style={{ padding: "11px 20px", color: "#b5d4f4", cursor: "pointer", fontSize: "14px" }}>Ventas</div>
          <div onClick={() => router.push("/cuenta-corriente")} style={{ padding: "11px 20px", color: "#fff", background: "#185FA5", cursor: "pointer", fontSize: "14px" }}>Cuenta corriente</div>
        </div>
        <div style={{ padding: "14px 20px", borderTop: "1px solid #2a4f7a" }}>
          <div onClick={async () => { await supabase.auth.signOut(); router.push("/"); }} style={{ color: "#f09595", cursor: "pointer", fontSize: "14px" }}>Cerrar sesion</div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #dde3ec", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "15px", fontWeight: "600", color: "#1e3a5f" }}>
            Cuenta corriente — {ficha.clientes?.apellido}, {ficha.clientes?.nombre}
          </span>
          <button onClick={() => router.push("/cuenta-corriente")} style={{ background: "transparent", color: "#6b7a8f", border: "1px solid #dde3ec", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontSize: "13px" }}>
            Volver
          </button>
        </div>

        <div style={{ padding: "24px", maxWidth: "700px" }}>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
            <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "14px" }}>
              <div style={{ fontSize: "11px", color: "#6b7a8f", marginBottom: "4px" }}>Fecha</div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e3a5f" }}>{ficha.fecha_examen}</div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "14px" }}>
              <div style={{ fontSize: "11px", color: "#6b7a8f", marginBottom: "4px" }}>Total</div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e3a5f" }}>${ficha.monto_total?.toLocaleString("es-AR")}</div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "14px" }}>
              <div style={{ fontSize: "11px", color: "#6b7a8f", marginBottom: "4px" }}>Total cobrado</div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#27500A" }}>${ficha.sena?.toLocaleString("es-AR")}</div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "14px" }}>
              <div style={{ fontSize: "11px", color: "#6b7a8f", marginBottom: "4px" }}>Saldo</div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: pagado ? "#27500A" : "#854F0B" }}>${saldo.toLocaleString("es-AR")}</div>
            </div>
          </div>

          <div style={{ marginBottom: "8px" }}>
            <span style={{ padding: "6px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: "600", background: pagado ? "#EAF3DE" : "#FAEEDA", color: pagado ? "#27500A" : "#854F0B" }}>
              {pagado ? "PAGADO" : "PENDIENTE"}
            </span>
          </div>

          <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "20px", marginBottom: "20px", marginTop: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f", marginBottom: "16px" }}>Historial de pagos</div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f0f2f5", fontSize: "13px" }}>
                <div style={{ color: "#6b7a8f" }}>Seña inicial</div>
                <div style={{ color: "#1e3a5f", fontWeight: "500" }}>${((ficha.sena || 0) - totalPagado).toLocaleString("es-AR")}</div>
              </div>
              {pagos.map((p, i) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f2f5", fontSize: "13px" }}>
                  <div>
                    <div style={{ color: "#1e3a5f", fontWeight: "500" }}>Pago {i + 1} — {p.fecha}</div>
                    {p.observaciones && <div style={{ color: "#6b7a8f", fontSize: "12px", marginTop: "2px" }}>{p.observaciones}</div>}
                  </div>
                  <div style={{ color: "#27500A", fontWeight: "600" }}>${p.monto?.toLocaleString("es-AR")}</div>
                </div>
              ))}
              {pagos.length === 0 && (
                <div style={{ color: "#6b7a8f", fontSize: "13px", padding: "10px 0" }}>No hay pagos adicionales registrados</div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: "14px", fontWeight: "600" }}>
              <div style={{ color: "#1e3a5f" }}>Total cobrado</div>
              <div style={{ color: "#27500A" }}>${ficha.sena?.toLocaleString("es-AR")}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: "14px", fontWeight: "600", borderTop: "1px solid #f0f2f5" }}>
              <div style={{ color: "#1e3a5f" }}>Saldo pendiente</div>
              <div style={{ color: pagado ? "#27500A" : "#854F0B" }}>${saldo.toLocaleString("es-AR")}</div>
            </div>
          </div>

          {!pagado && (
            <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "20px" }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f", marginBottom: "16px" }}>Registrar nuevo pago</div>
              {error && <div style={{ background: "#FCEBEB", color: "#A32D2D", padding: "10px 14px", borderRadius: "6px", marginBottom: "12px", fontSize: "13px" }}>{error}</div>}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "4px" }}>Monto</div>
                  <input type="number" value={montoPago} onChange={(e) => setMontoPago(e.target.value)} placeholder="0" style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "4px" }}>Observaciones</div>
                  <input type="text" value={obsPago} onChange={(e) => setObsPago(e.target.value)} placeholder="Opcional..." style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
                </div>
              </div>
              <button onClick={registrarPago} disabled={guardando} style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: "6px", padding: "10px 20px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}>
                {guardando ? "Guardando..." : "Confirmar pago"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}