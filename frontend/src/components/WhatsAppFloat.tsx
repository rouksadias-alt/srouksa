"use client";

const DEFAULT_MESSAGE = "Hola! Tengo una pregunta sobre Numapetstore.";

export function WhatsAppFloat() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (!number) return null;
  const href = `https://wa.me/${number.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contáctanos por WhatsApp"
      className="group fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 font-black text-white shadow-lg shadow-[#25D366]/30 transition active:scale-95 hover:bg-[#1ebe57] lg:bottom-6"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 fill-white"
        aria-hidden="true"
      >
        <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.607zm5.396-7.43c-.299-.498-.66-.51-.949-.524-.247-.012-.53-.012-.812-.012-.282 0-.741.106-1.13.529-.387.422-1.482 1.448-1.482 3.531 0 2.083 1.519 4.094 1.731 4.376.212.282 2.951 4.713 7.244 6.422 3.57 1.422 4.296 1.139 5.07 1.069.776-.069 2.498-1.021 2.85-2.007.353-.987.353-1.832.247-2.008-.105-.176-.388-.282-.812-.494-.423-.211-2.498-1.232-2.886-1.374-.388-.141-.671-.211-.953.212-.283.422-1.094 1.374-1.342 1.656-.246.282-.495.317-.918.106-.423-.211-1.787-.659-3.405-2.102-1.258-1.122-2.108-2.508-2.355-2.93-.247-.422-.026-.65.186-.86.19-.19.423-.494.635-.741.21-.247.282-.423.422-.706.142-.282.07-.529-.035-.74-.106-.211-.929-2.243-1.272-3.069z" />
      </svg>
      <span className="hidden text-sm sm:inline">¿Dudas? Escríbenos</span>
    </a>
  );
}
