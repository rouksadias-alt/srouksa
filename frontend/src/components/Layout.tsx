import Link from "next/link";

import { CartButton, CartDrawer, MobileBuyBar } from "@/components/CartDrawer";
import { Logo } from "@/components/Logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#ead3dd] bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <Logo />
        <div className="hidden items-center gap-8 text-sm font-bold text-[#3a2330] lg:flex">
          <Link href="/">Inicio</Link>
          <Link href="/collection">Productos</Link>
          <Link href="/about">Sobre nosotros</Link>
          <Link href="/contact">Contacto</Link>
        </div>
        <CartButton />
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-[#2a1620] px-5 py-12 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-md text-slate-300">
            Numapetstore crea rutinas premium para hogares panamenos con mascotas:
            limpieza, hidratacion y juego inteligente con pago contra entrega.
          </p>
        </div>
        <div>
          <h3 className="font-black">Menu</h3>
          <div className="mt-4 grid gap-2 text-slate-300">
            <Link href="/collection">Coleccion</Link>
            <Link href="/about">Sobre nosotros</Link>
            <Link href="/contact">Contacto</Link>
          </div>
        </div>
        <div>
          <h3 className="font-black">Confianza</h3>
          <p className="mt-4 text-slate-300">
            Pago contra entrega, soporte por WhatsApp y confirmacion antes del envio.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <div className="border-b border-[#ead3dd] bg-[#fdebf3] px-5 py-2 text-center text-xs font-black text-[#7b2149]">
        Pago contra entrega · Confirmacion por WhatsApp · Entrega en Panama · Ofertas bundle
      </div>
      <div className="pb-20 lg:pb-0">{children}</div>
      <SiteFooter />
      <CartDrawer />
      <MobileBuyBar />
    </>
  );
}
