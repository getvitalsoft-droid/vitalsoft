export default function Reembolsos() {
  return (
    <main className="min-h-screen bg-[#080808] px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <a href="/" className="text-white/30 text-sm hover:text-accent transition-colors mb-8 inline-block">← Volver</a>
        <h1 className="font-display font-black text-3xl mb-2">Política de reembolsos</h1>
        <p className="text-white/30 text-xs mb-10">Última actualización: mayo 2025</p>
        <div className="space-y-8 text-white/55 text-sm leading-relaxed font-light">
          <section>
            <h2 className="font-display font-bold text-white text-base mb-3">Principio general</h2>
            <p>VitalSoft no realiza reembolsos por períodos de servicio ya iniciados. La cancelación de una suscripción activa tiene efecto al final del período de facturación en curso.</p>
          </section>
          <section>
            <h2 className="font-display font-bold text-white text-base mb-3">Excepciones</h2>
            <p>Consideraremos reembolsos en los siguientes casos: error técnico imputable a VitalSoft que impida la prestación del servicio, primer mes si no se ha iniciado producción y el cliente lo solicita en las primeras 48h tras el pago.</p>
          </section>
          <section>
            <h2 className="font-display font-bold text-white text-base mb-3">Proceso</h2>
            <p>Para solicitar un reembolso escríbenos a <a href="mailto:hola@vitalsoft.pro?subject=Solicitud de reembolso&body=Hola, quiero solicitar un reembolso.%0A%0AEmail de mi cuenta: %0AMotivo: %0A" className="text-accent">hola@vitalsoft.pro</a> indicando el motivo. Respondemos en 48–72h laborables.</p>
          </section>
          <section>
            <h2 className="font-display font-bold text-white text-base mb-3">Lo que no reembolsamos</h2>
            <p>No reembolsamos por: resultados del contenido editado, expectativas no ajustadas a lo descrito en el servicio, material enviado tarde por el cliente o cancelaciones fuera de plazo.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
