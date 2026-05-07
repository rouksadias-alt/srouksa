import Image from "next/image";

import {
  BundleOffers,
  EducationSections,
  FAQSection,
  ReviewsSection,
} from "@/components/CROSections";
import { AddOfferButton, MobileBuyBar, OfferSelector } from "@/components/CartDrawer";
import { AppShell } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/config/products";

export default function Home() {
  return (
    <AppShell>
      <main className="bg-[#fff7fb] text-[#2a1620]">
        <section className="relative overflow-hidden border-b border-[#ead3dd] bg-[radial-gradient(circle_at_20%_20%,#fde1ee,transparent_35%),linear-gradient(180deg,#fff7fb,#fdeef5)] px-5 py-8 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-10">
            <div className="order-2 text-center lg:order-1 lg:text-left">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#b4155a]">
                Numapet Ritual · Panamá
              </p>
              <div className="mt-2 flex items-center justify-center gap-2 text-sm font-bold text-[#2a1620] lg:justify-start">
                <span className="text-amber-500">★★★★★</span>
                <span>4.9/5</span>
                <span className="text-[#7b5867]">· +2,000 hogares panameños</span>
              </div>
              <h1 className="mx-auto mt-3 max-w-3xl text-3xl font-black leading-[1.1] tracking-tight md:text-5xl lg:mx-0 lg:text-6xl">
                Alfombra refrescante premium para tu mascota.
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[#6c4a58] md:text-lg md:leading-8 lg:mx-0">
                Descanso fresco sin prender más aire. Lavable, antideslizante y lista para el calor de Panamá.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-sm font-bold text-[#4f7a58] lg:justify-start">
                <span>✓ Pago contra entrega</span>
                <span>✓ Envío en Panamá</span>
                <span>✓ Garantía 30 días</span>
              </div>

              <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-[#ead3dd] bg-white/70 px-4 py-3 text-center lg:mx-0 lg:text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-[#7b5867]">
                  Desde
                </p>
                <p className="mt-0.5 text-2xl font-black text-[#2a1620]">
                  $45 <span className="text-sm font-bold text-[#7b5867]">· COD disponible</span>
                </p>
              </div>

              <div className="mx-auto mt-5 max-w-xl lg:mx-0">
                <OfferSelector productSlug="pelocero-casa-kit" />
              </div>
            </div>

            <div className="order-1 rounded-[1.5rem] border border-[#ead3dd] bg-white p-3 shadow-sm lg:order-2 lg:rounded-[2rem] lg:p-4">
              <div className="relative min-h-[240px] overflow-hidden rounded-[1.25rem] bg-white sm:min-h-[300px] lg:min-h-[360px] lg:rounded-[1.5rem]">
                <Image
                  src="/products/cooling-mat-hero.png"
                  alt="PeloCero Fresh Mat para mascotas"
                  fill
                  priority
                  className="object-contain p-3 lg:p-5"
                />
                <span className="absolute left-3 top-3 rounded-full bg-[#b4155a] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                  Best seller
                </span>
              </div>
              <div className="hidden p-5 lg:block">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b4155a]">
                  Producto destacado
                </p>
                <h2 className="mt-2 text-2xl font-black">PeloCero Fresh Mat</h2>
                <p className="mt-2 text-sm text-[#6c4a58]">
                  Descanso fresco, suave y lavable para perros y gatos.
                </p>
                <div className="mt-3 text-sm font-black text-amber-500">★★★★★</div>
                <div className="mt-5">
                  <AddOfferButton productSlug="pelocero-casa-kit" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#ead3dd] bg-[#fdebf3] px-5 py-8">
          <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-4">
            {[
              ["Sin pago por adelantado", "Confirmas primero por telefono."],
              ["Rutina completa", "Limpieza, agua y juego en un sistema."],
              ["Bundle inteligente", "2 y 3 piezas con mejor valor."],
              ["Soporte local", "Comunicacion clara por WhatsApp."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-2xl bg-white/70 p-4">
                <h3 className="font-black">{title}</h3>
                <p className="mt-2 text-sm text-[#7b5867]">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16">
          <div className="mb-8 max-w-3xl">
            <p className="font-black text-teal-700">Coleccion principal</p>
            <h2 className="mt-2 text-4xl font-black tracking-tight text-center md:text-left">
              Elige tu ritual Numapet.
            </h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>

        <EducationSections />

        <BundleOffers />

        <section className="bg-white px-5 py-16">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
            <div className="relative min-h-[380px] overflow-hidden rounded-[2rem] bg-[#fdebf3]">
              <Image
                src="/products/cooling-mat-washable.png"
                alt="Alfombra lavable para mascotas"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="font-black text-[#b4155a] uppercase tracking-wider text-sm">Calidad Comprobada</p>
              <h2 className="mt-2 text-4xl font-black">
                Diseñado para resistir la rutina de tu hogar.
              </h2>
              <p className="mt-4 text-slate-600 text-lg">
                Olvídate de las camas que se rompen al primer lavado o acumulan malos olores. Nuestros productos están fabricados con materiales de alta resistencia, fáciles de limpiar y pensados para durar años, no meses.
              </p>
              <ul className="mt-6 grid gap-3 text-[#6c4a58] font-medium">
                <li className="flex items-center gap-2"><span className="text-[#b4155a]">✓</span> Costuras reforzadas anti-rasguños</li>
                <li className="flex items-center gap-2"><span className="text-[#b4155a]">✓</span> Materiales que repelen líquidos y olores</li>
                <li className="flex items-center gap-2"><span className="text-[#b4155a]">✓</span> 100% lavable a máquina en casa</li>
              </ul>
            </div>
          </div>
        </section>

        <ReviewsSection />
        <FAQSection />
      </main>
    </AppShell>
  );
}
