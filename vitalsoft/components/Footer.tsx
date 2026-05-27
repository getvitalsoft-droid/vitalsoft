export default function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="font-display font-black text-lg">
            <span className="text-accent">Vital</span><span className="text-white/60">Soft</span>
          </div>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            <a href="/terminos" className="text-white/25 text-xs hover:text-white/50 transition-colors">Términos del servicio</a>
            <a href="/privacidad" className="text-white/25 text-xs hover:text-white/50 transition-colors">Privacidad</a>
            <a href="/reembolsos" className="text-white/25 text-xs hover:text-white/50 transition-colors">Política de reembolsos</a>
            <a href="mailto:getvitalsoft@gmail.com" className="text-white/25 text-xs hover:text-white/50 transition-colors">Contacto</a>
          </div>
          <p className="text-white/15 text-xs">© 2025 VitalSoft</p>
        </div>
      </div>
    </footer>
  );
}
