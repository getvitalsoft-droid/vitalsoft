export default function Terminos() {
  return (
    <main className="min-h-screen bg-[#080808] px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <a href="/" className="text-white/30 text-sm hover:text-accent transition-colors mb-8 inline-block">← Volver</a>
        <h1 className="font-display font-black text-3xl mb-2">Términos del servicio</h1>
        <p className="text-white/30 text-xs mb-10">Última actualización: mayo 2025</p>
        <div className="space-y-8 text-white/55 text-sm leading-relaxed font-light">
          <section>
            <h2 className="font-display font-bold text-white text-base mb-3">1. El servicio</h2>
            <p>VitalSoft ofrece un servicio de edición y adaptación de contenido vídeo/audio a formato corto (clips). El servicio incluye edición, subtítulos y exportación en los formatos acordados según el plan contratado.</p>
          </section>
          <section>
            <h2 className="font-display font-bold text-white text-base mb-3">2. Lo que no incluye el servicio</h2>
            <p>VitalSoft no gestiona redes sociales, no garantiza viralidad ni crecimiento, no publica contenido, no ofrece consultoría de estrategia y no realiza SEO ni optimización de algoritmos. El rendimiento del contenido depende de factores externos fuera de nuestro control.</p>
          </section>
          <section>
            <h2 className="font-display font-bold text-white text-base mb-3">3. Ajustes y revisiones</h2>
            <p>Cada plan incluye un número determinado de ajustes por clip. Un ajuste cubre cambios razonables sobre el material entregado: subtítulos, timing, música, zooms o cortes pequeños. No constituyen ajuste: rehacer el estilo completo, solicitar clips adicionales, cambiar branding desde cero o cambios masivos en múltiples clips.</p>
          </section>
          <section>
            <h2 className="font-display font-bold text-white text-base mb-3">4. Material del cliente</h2>
            <p>El plazo de entrega comienza desde que recibimos el material validado, no desde el pago. El cliente es responsable de proporcionar material de calidad suficiente. VitalSoft puede rechazar material que no cumpla los requisitos mínimos de calidad.</p>
          </section>
          <section>
            <h2 className="font-display font-bold text-white text-base mb-3">5. Facturación y cancelación</h2>
            <p>El servicio se factura mensualmente. Puedes cancelar en cualquier momento desde tu panel de Stripe. La cancelación entra en vigor al final del período de facturación en curso. No se realizan reembolsos por períodos parciales salvo en los casos indicados en la política de reembolsos.</p>
          </section>
          <section>
            <h2 className="font-display font-bold text-white text-base mb-3">6. Propiedad intelectual</h2>
            <p>El cliente mantiene todos los derechos sobre su contenido original. VitalSoft no reclama propiedad sobre el material editado. VitalSoft puede usar ejemplos anónimos del trabajo realizado para fines promocionales salvo indicación contraria expresa del cliente.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
