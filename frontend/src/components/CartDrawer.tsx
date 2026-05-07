"use client";

import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { offers, products, type Offer, type ProductSlug } from "@/config/products";
import { createEventId, normalizePanamaPhone } from "@/lib/phone";
import { getCartLines, useCartStore } from "@/stores/cart";

const checkoutSchema = z.object({
  fullName: z.string().min(4, "Escribe nombre y apellido"),
  phone: z.string().refine((value) => normalizePanamaPhone(value) !== null, {
    message: "Usa un numero valido de Panama (+507 o 8 digitos)",
  }),
  address: z.string().min(8, "Escribe tu direccion"),
  city: z.string().min(2, "Escribe tu ciudad"),
  fastShipping: z.boolean(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export function CartDrawer() {
  const {
    items,
    isCartOpen,
    checkoutState,
    removeItem,
    closeCart,
    openCheckout,
    openUpsell,
    closeCheckout,
    clearCart,
    addOffer,
  } = useCartStore();

  const lines = useMemo(() => getCartLines(items), [items]);
  const total = lines.reduce((sum, line) => sum + line.total, 0);
  const crossSell = products.find(
    (product) => !items.some((item) => item.productSlug === product.slug),
  );

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      address: "",
      city: "",
      fastShipping: false,
    },
  });

  const fastShippingSelected = useWatch({
    control: form.control,
    name: "fastShipping",
  });
  const checkoutTotal = total + (fastShippingSelected ? 2 : 0);

  async function submitOrder(values: CheckoutForm) {
    const eventId = createEventId("Lead");
    const normalizedPhone = normalizePanamaPhone(values.phone);

    await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: eventId,
        customer_name: values.fullName,
        phone: normalizedPhone,
        address: values.address,
        city: values.city,
        fast_shipping: values.fastShipping,
        shipping_total: values.fastShipping ? 2 : 0,
        currency: "USD",
        total: checkoutTotal,
        items: lines.map((line) => ({
          product_slug: line.product.slug,
          product_name: line.product.name,
          offer_label: line.offer.label,
          quantity: line.offer.quantity,
          price: line.offer.price,
        })),
      }),
    }).catch(() => null);

    openUpsell();
  }

  if (!isCartOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-950/40" onClick={closeCart} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white text-slate-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <p className="text-sm font-bold text-teal-700">Pedido contra entrega</p>
            <h2 className="text-2xl font-black">Tu carrito</h2>
          </div>
          <button onClick={closeCart} className="rounded-full bg-slate-100 px-3 py-2 font-bold">
            Cerrar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {lines.length === 0 ? (
            <p className="rounded-2xl bg-slate-100 p-5 text-slate-600">
              Tu carrito esta vacio. Elige una oferta para empezar.
            </p>
          ) : (
            <div className="space-y-4">
              {lines.map((line) => (
                <div key={line.index} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex justify-between gap-4">
                    <div>
                      <h3 className="font-black">{line.product.name}</h3>
                      <p className="text-sm text-slate-500">
                        {line.offer.label} · {line.offer.anchor}
                      </p>
                    </div>
                    <button onClick={() => removeItem(line.index)} className="text-sm font-bold text-slate-500">
                      Quitar
                    </button>
                  </div>
                  <p className="mt-3 text-xl font-black">${line.total}</p>
                </div>
              ))}
            </div>
          )}

          {crossSell ? (
            <div className="mt-6 rounded-3xl bg-teal-50 p-5">
              <p className="text-sm font-black text-teal-800">Completa tu rutina Numapet</p>
              <h3 className="mt-1 text-xl font-black">{crossSell.name}</h3>
              <p className="mt-2 text-sm text-slate-600">{crossSell.cardSubheading}</p>
              <button
                onClick={() => addOffer(crossSell.slug, "two")}
                className="mt-4 rounded-full bg-teal-700 px-5 py-3 text-sm font-black text-white"
              >
                Agregar oferta 2 piezas - $65
              </button>
            </div>
          ) : null}
        </div>

        <div className="border-t border-slate-200 p-5">
          <div className="flex justify-between text-xl font-black">
            <span>Total</span>
            <span>${total}</span>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Pago contra entrega. Te confirmamos por telefono o WhatsApp.
          </p>
          <button
            disabled={lines.length === 0}
            onClick={openCheckout}
            className="mt-4 w-full rounded-full bg-slate-950 px-6 py-4 font-black text-white disabled:opacity-40"
          >
            Confirmar pedido
          </button>
        </div>
      </aside>

      {checkoutState === "checkout" ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/60 p-4">
          <form onSubmit={form.handleSubmit(submitOrder)} className="w-full max-w-lg rounded-3xl bg-white p-6 text-slate-950">
            <p className="font-bold text-teal-700">Datos para confirmar entrega</p>
            <h2 className="mt-2 text-3xl font-black">Confirma tu pedido COD</h2>
            <p className="mt-3 text-sm text-slate-600">
              Cupos de entrega contra entrega limitados por dia. No pagas ahora.
            </p>
            <label className="mt-5 block text-sm font-bold">Nombre y Apellido</label>
            <input className="mt-2 w-full rounded-2xl border border-slate-300 p-4" placeholder="Nombre y Apellido" {...form.register("fullName")} />
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.fullName?.message}</p>
            <label className="mt-4 block text-sm font-bold">Telefono</label>
            <input className="mt-2 w-full rounded-2xl border border-slate-300 p-4" placeholder="Telefono" {...form.register("phone")} />
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.phone?.message}</p>
            <label className="mt-4 block text-sm font-bold">Direccion</label>
            <input className="mt-2 w-full rounded-2xl border border-slate-300 p-4" placeholder="Direccion" {...form.register("address")} />
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.address?.message}</p>
            <label className="mt-4 block text-sm font-bold">Ciudad</label>
            <input className="mt-2 w-full rounded-2xl border border-slate-300 p-4" placeholder="Ciudad" {...form.register("city")} />
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.city?.message}</p>
            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-[#ead3dd] bg-[#fff7fb] p-4">
              <input
                type="checkbox"
                className="mt-1 size-5 accent-[#b4155a]"
                {...form.register("fastShipping")}
              />
              <span>
                <span className="block font-black text-[#2a1620]">
                  Agregar envio rapido +$2
                </span>
                <span className="mt-1 block text-sm text-[#6c4a58]">
                  Prioridad de confirmacion y despacho en zonas disponibles.
                </span>
              </span>
            </label>
            <div className="mt-5 rounded-2xl bg-slate-100 p-4">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Productos</span>
                <span>${total}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm text-slate-600">
                <span>Envio rapido</span>
                <span>{fastShippingSelected ? "$2" : "$0"}</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-slate-300 pt-3 text-xl font-black">
                <span>Total</span>
                <span>${checkoutTotal}</span>
              </div>
            </div>
            
            <div className="mt-4 flex flex-col items-center justify-center gap-2 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1">
                <span className="text-teal-600 text-base">🔒</span> Tus datos están seguros. Solo los usamos para coordinar tu entrega.
              </div>
            </div>

            <button className="mt-3 w-full rounded-full bg-teal-700 px-6 py-4 font-black text-white shadow-md hover:bg-teal-800 transition-colors">
              Confirmar mi pedido contra entrega
            </button>
            <button type="button" onClick={closeCheckout} className="mt-3 w-full text-sm font-bold text-slate-500">
              Volver
            </button>
          </form>
        </div>
      ) : null}

      {checkoutState === "upsell" ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 text-slate-950">
            <p className="font-bold text-amber-700">Oferta unica antes de cerrar</p>
            <h2 className="mt-2 text-3xl font-black">Agrega AguaViva Flow por solo $29</h2>
            <p className="mt-3 text-slate-600">
              Esta oferta aparece solo ahora para completar la rutina de hidratacion.
            </p>
            <button
              onClick={() => {
                addOffer("aguaviva-flow", "one");
                clearCart();
              }}
              className="mt-5 w-full rounded-full bg-amber-700 px-6 py-4 font-black text-white"
            >
              Agregar a mi pedido
            </button>
            <button onClick={clearCart} className="mt-3 w-full text-sm font-bold text-slate-500">
              No gracias, continuar
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function CartButton() {
  const { items, openCart } = useCartStore();
  return (
    <button
      onClick={openCart}
      className="grid size-10 place-items-center rounded-full border border-[#ead3dd] bg-white text-sm font-black text-[#2a1620]"
      aria-label={`Carrito con ${items.length} productos`}
    >
      🛒
    </button>
  );
}

export function AddOfferButton({ productSlug, offerId = "two" }: { productSlug: ProductSlug; offerId?: Offer["id"] }) {
  const addOffer = useCartStore((state) => state.addOffer);
  return (
    <button onClick={() => addOffer(productSlug, offerId)} className="rounded-full bg-[#b4155a] px-6 py-3 text-center font-black text-white transition hover:bg-[#95104a]">
      Agregar oferta al carrito
    </button>
  );
}

export function OfferSelector({ productSlug }: { productSlug: ProductSlug }) {
  const addOffer = useCartStore((state) => state.addOffer);
  return (
    <div className="flex flex-col gap-2.5 sm:grid sm:grid-cols-3 sm:gap-3">
      {offers.map((offer) => {
        const isPopular = offer.id === "two";
        return (
          <button
            key={offer.id}
            onClick={() => addOffer(productSlug, offer.id)}
            className={`group relative flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition active:scale-[0.99] hover:border-[#b4155a] sm:flex-col sm:items-start sm:justify-start sm:gap-0 sm:rounded-3xl sm:p-5 sm:min-h-36 ${
              isPopular
                ? "border-2 border-[#b4155a] bg-[#fff5f9] shadow-sm ring-2 ring-[#f2c6d8] sm:ring-4"
                : "border-[#ead3dd] bg-white"
            }`}
          >
            {isPopular ? (
              <span className="absolute -top-2.5 left-4 rounded-full bg-[#b4155a] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm sm:left-1/2 sm:-translate-x-1/2">
                ⭐ Más elegido
              </span>
            ) : null}

            <div className="flex-1 sm:w-full">
              <p className="hidden text-xs font-bold uppercase tracking-wider text-[#7b5867] sm:block">
                {offer.anchor}
              </p>
              <p className="text-base font-black leading-tight text-[#2a1620] sm:mt-2 sm:text-xl">
                {offer.label}
              </p>
              <p className="text-xs text-[#7b5867] sm:hidden">
                {offer.anchor}
              </p>
            </div>

            <div className="flex flex-col items-end gap-0.5 sm:mt-4 sm:w-full sm:flex-row sm:items-center sm:justify-between">
              <p className="text-2xl font-black tracking-tight text-[#b4155a] sm:text-4xl">
                ${offer.price}
              </p>
              {offer.badge ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-black text-emerald-700 sm:bg-transparent sm:px-0 sm:text-sm sm:text-[#0f766e]">
                  {offer.badge}
                </span>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function MobileBuyBar({
  productSlug = "pelocero-casa-kit",
  offerId = "two",
}: {
  productSlug?: ProductSlug;
  offerId?: Offer["id"];
}) {
  const addOffer = useCartStore((state) => state.addOffer);
  const openCart = useCartStore((state) => state.openCart);
  const offer = offers.find((o) => o.id === offerId);
  if (!offer) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#ead3dd] bg-white/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(180,21,90,0.25)] backdrop-blur lg:hidden">
      <button
        onClick={() => {
          addOffer(productSlug, offerId);
          openCart();
        }}
        className="flex w-full items-center justify-between gap-3 rounded-full bg-[#b4155a] px-5 py-3.5 text-white shadow-md transition active:scale-[0.99]"
      >
        <div className="flex flex-col items-start leading-tight">
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
            ⭐ Más elegido · {offer.label}
          </span>
          <span className="text-base font-black">Comprar ahora — ${offer.price}</span>
        </div>
        <span className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-black">
          →
        </span>
      </button>
    </div>
  );
}
