export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/[0.06] px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">

          {/* Logo + tagline */}
          <div>
            <div className="font-display font-black text-lg mb-1">
              <span className="text-accent">Vital</span><span className="text-white/70">Soft</span>
            </div>
            <p className="text-white/30 text-xs max-w-xs">
              Servicio de edición por suscripción que convierte tu contenido largo en clips listos para publicar, cada mes.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="space-y-2">
              <div className="text-white/25 text-[10px] uppercase tracking-widest font-semibold mb-2">Acceso</div>
              <a href="/cliente" className="block text-white/40 text-xs hover:text-white/70 transition-colors">Portal cliente</a>
              <a href="/agentes" className="block text-white/40 text-xs hover:text-white/70 transition-colors">Portal agentes</a>
            </div>
            <div className="space-y-2">
              <div className="text-white/25 text-[10px] uppercase tracking-widest font-semibold mb-2">Legal</div>
              <a href="/terminos" className="block text-white/40 text-xs hover:text-white/70 transition-colors">Términos del servicio</a>
              <a href="/privacidad" className="block text-white/40 text-xs hover:text-white/70 transition-colors">Privacidad</a>
              <a href="/reembolsos" className="block text-white/40 text-xs hover:text-white/70 transition-colors">Reembolsos</a>
            </div>
            <div className="space-y-2">
              <div className="text-white/25 text-[10px] uppercase tracking-widest font-semibold mb-2">Contacto</div>
              <a href="mailto:getvitalsoft@gmail.com" className="block text-white/40 text-xs hover:text-accent transition-colors">getvitalsoft@gmail.com</a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.04] mt-8 pt-6">
          <p className="text-white/20 text-xs">© {year} VitalSoft. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
