export type ProductSlug = "pelocero-casa-kit" | "aguaviva-flow" | "juegasolo-motion-kit";

export type Variant = {
  id: "s" | "m" | "l" | "xl";
  label: string;
  size: string;
  price: number;
  anchor: string;
  badge?: string;
};

export type Product = {
  slug: ProductSlug;
  name: string;
  shortName: string;
  category: string;
  cardHeading: string;
  cardSubheading: string;
  heroHeadline: string;
  heroSubheadline: string;
  pain: string[];
  mechanism: string;
  science: {
    headline: string;
    description: string;
  };
  ingredients: {
    headline: string;
    items: string[];
  };
  authority: {
    headline: string;
    description: string;
  };
  includes: string[];
  accent: string;
  image: string;
};

export const variants: Variant[] = [
  {
    id: "s",
    label: "Talla S",
    size: "Pequeño (hasta 7 kg)",
    price: 39,
    anchor: "Razas pequeñas",
  },
  {
    id: "m",
    label: "Talla M",
    size: "Mediano (7–15 kg)",
    price: 45,
    anchor: "Mas elegido",
    badge: "Ideal para la mayoria",
  },
  {
    id: "l",
    label: "Talla L",
    size: "Grande (15–30 kg)",
    price: 55,
    anchor: "Razas grandes",
  },
  {
    id: "xl",
    label: "Talla XL",
    size: "Extra Grande (+30 kg)",
    price: 65,
    anchor: "Razas gigantes",
  },
];

export const products: Product[] = [
  {
    slug: "pelocero-casa-kit",
    name: "PeloCero Fresh Mat",
    shortName: "Fresh Mat",
    category: "Confort fresco",
    cardHeading: "Un descanso mas fresco para dias calientes.",
    cardSubheading:
      "Alfombra refrescante, suave y lavable para perros y gatos en clima caliente.",
    heroHeadline: "Dale a tu mascota un lugar fresco sin prender mas aire.",
    heroSubheadline:
      "PeloCero Fresh Mat es una alfombra premium para descanso fresco, facil de limpiar y lista para la rutina diaria.",
    pain: [
      "Tu mascota busca el piso frio durante el calor.",
      "Las camas comunes se sienten calientes y guardan olor.",
      "Quieres algo lavable que se vea limpio en casa.",
    ],
    mechanism:
      "La superficie acolchada ayuda a crear una zona de descanso mas fresca, mientras el material lavable facilita mantenerla limpia.",
    science: {
      headline: "Diseño termorregulador pasivo",
      description: "A diferencia de las camas tradicionales que atrapan el calor corporal, el tejido especial de PeloCero disipa la temperatura hacia el ambiente, manteniendo a tu mascota fresca sin necesidad de electricidad o refrigeración activa.",
    },
    ingredients: {
      headline: "Materiales pensados para tu hogar",
      items: [
        "Capa superior de seda de hielo transpirable",
        "Relleno de algodón de alta densidad",
        "Base antideslizante con malla ventilada",
        "Costuras reforzadas anti-rasguños"
      ],
    },
    authority: {
      headline: "Recomendado para el clima de Panamá",
      description: "Desarrollado pensando en las altas temperaturas y humedad de nuestro país. Ideal para prevenir golpes de calor y mejorar la calidad de vida de tu mascota en interiores.",
    },
    includes: ["Alfombra Fresh Mat", "Superficie suave tipo cooling", "Uso interior, sofa o piso", "Lavable a maquina"],
    accent: "bg-teal-700",
    image: "/products/cooling-mat-hero.png",
  },
  {
    slug: "aguaviva-flow",
    name: "AguaViva Flow",
    shortName: "AguaViva",
    category: "Hidratacion",
    cardHeading: "Agua fresca que invita a tomar mas.",
    cardSubheading:
      "Fuente premium para una rutina de hidratacion mas limpia y constante.",
    heroHeadline: "Una rutina de agua mas atractiva para tu mascota.",
    heroSubheadline:
      "AguaViva Flow mantiene el agua en movimiento para ayudar a que beber sea mas interesante durante el dia.",
    pain: [
      "Tu mascota ignora el plato de agua.",
      "Te preocupa cuando pasas muchas horas fuera.",
      "El calor de Panama hace que la hidratacion se sienta mas importante.",
    ],
    mechanism:
      "El flujo visible crea movimiento constante, ayuda a renovar la experiencia del agua y hace mas facil mantener una rutina limpia.",
    science: {
      headline: "Instinto natural de hidratación",
      description: "Los animales asocian el agua estancada con peligro. AguaViva simula un arroyo natural, activando su instinto primario y aumentando su consumo de agua hasta en un 40%.",
    },
    ingredients: {
      headline: "Filtración de grado humano",
      items: [
        "Filtro de carbón activado de cáscara de coco",
        "Resina de intercambio iónico",
        "Malla de algodón de alta densidad",
        "Motor ultra silencioso (<30dB)"
      ],
    },
    authority: {
      headline: "Aprobado por veterinarios",
      description: "Una hidratación adecuada previene enfermedades renales y del tracto urinario, problemas comunes en climas tropicales como el de Panamá.",
    },
    includes: ["Fuente AguaViva Flow", "Filtro inicial", "Guia de limpieza rapida"],
    accent: "bg-cyan-700",
    image: "/products/cooling-mat-action.png",
  },
  {
    slug: "juegasolo-motion-kit",
    name: "JuegaSolo Motion Kit",
    shortName: "JuegaSolo",
    category: "Juego inteligente",
    cardHeading: "Juego inteligente cuando no tienes tiempo.",
    cardSubheading:
      "Movimiento automatico para mantener a tu mascota activa y curiosa.",
    heroHeadline: "Dale estimulo incluso en dias ocupados.",
    heroSubheadline:
      "JuegaSolo Motion Kit crea movimiento y curiosidad para canalizar energia cuando estas trabajando o fuera.",
    pain: [
      "Tu mascota se aburre en apartamento.",
      "Rasca muebles o busca atencion mientras trabajas.",
      "Sientes culpa por no jugar siempre que quiere.",
    ],
    mechanism:
      "El movimiento intermitente despierta curiosidad y crea sesiones cortas de juego sin exigir tu atencion todo el tiempo.",
    science: {
      headline: "Estimulación cognitiva intermitente",
      description: "El cerebro de tu mascota necesita desafíos impredecibles. JuegaSolo utiliza un algoritmo de movimiento aleatorio que simula una presa real, manteniendo su atención sin sobreestimularlo.",
    },
    ingredients: {
      headline: "Construido para resistir",
      items: [
        "Carcasa de ABS de grado militar",
        "Plumas y accesorios no tóxicos",
        "Batería de litio de larga duración",
        "Sensores de obstáculos inteligentes"
      ],
    },
    authority: {
      headline: "Bienestar emocional en casa",
      description: "Expertos en comportamiento animal confirman que el juego independiente reduce la ansiedad por separación y comportamientos destructivos en mascotas de apartamento.",
    },
    includes: ["Modulo Motion", "Accesorio de juego", "Guia de rutina 10 minutos"],
    accent: "bg-amber-700",
    image: "/products/cooling-mat-washable.png",
  },
];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}
