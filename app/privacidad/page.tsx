export default function Privacidad() {
  return (
    <main className="min-h-screen bg-[#080808] px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <a href="/" className="text-white/30 text-sm hover:text-accent transition-colors mb-8 inline-block">← Volver</a>
        <h1 className="font-display font-black text-3xl mb-2">Política de privacidad</h1>
        <p className="text-white/30 text-xs mb-10">Última actualización: mayo 2025</p>
        <div className="space-y-8 text-white/55 text-sm leading-relaxed font-light">
          <section>
            <h2 className="font-display font-bold text-white text-base mb-3">Datos que recopilamos</h2>
            <p>Recopilamos nombre, email, información de pago (gestionada por Stripe) y el material que nos envías para editar. También guardamos datos de uso básicos para mejorar el servicio.</p>
          </section>
          <section>
            <h2 className="font-display font-bold text-white text-base mb-3">Cómo usamos tus datos</h2>
            <p>Usamos tus datos únicamente para prestar el servicio contratado, gestionar tu suscripción, enviarte notificaciones relacionadas con tu cuenta y mejorar nuestro servicio.</p>
          </section>
          <section>
            <h2 className="font-display font-bold text-white text-base mb-3">Terceros</h2>
            <p>Usamos Stripe para procesar pagos, Supabase para almacenar datos y Resend para emails transaccionales. Ninguno de estos proveedores vende tus datos.</p>
          </section>
          <section>
            <h2 className="font-display font-bold text-white text-base mb-3">Tus derechos</h2>
            <p>Puedes solicitar acceso, corrección o eliminación de tus datos en cualquier momento contactando a <a href="mailto:getvitalsoft@gmail.com" className="text-accent">getvitalsoft@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
