import Image from "next/image";

const productos = [
  { nombre: "Águila Light", archivo: "Águila ligth.jpg" },
  { nombre: "Águila Original", archivo: "Águila original.webp" },
  { nombre: "Agua Brisa", archivo: "agua_brisa.png" },
  { nombre: "Bretaña", archivo: "Bretaña.png" },
  { nombre: "Cera en Polvo Rolda", archivo: "Cera en Polvo Rolda.png" },
  { nombre: "Cera Red One", archivo: "Cera red One.avif" },
  { nombre: "Cheetos", archivo: "cheetos.png" },
  { nombre: "Cheetos Boliqueso", archivo: "cheetos Boliqueso.webp" },
  { nombre: "Chestris", archivo: "Chestris.webp" },
  { nombre: "Choclitos", archivo: "Choclitos.png" },
  { nombre: "Club Colombia", archivo: "Club Colombia.webp" },
  { nombre: "Coca Cola", archivo: "Coca cola.png" },
  { nombre: "Cola y Pola", archivo: "Cola y Pola.webp" },
  { nombre: "Coronita", archivo: "Coronita.png" },
  { nombre: "Costeña", archivo: "Costeña.png" },
  { nombre: "Crema Churcos Rolda", archivo: "Crema CHURCOS Rolda.webp" },
  { nombre: "Crema White Rolda", archivo: "Crema white Rolda.png" },
  { nombre: "Detodito", archivo: "detodito.webp" },
  { nombre: "Doritos", archivo: "doritos.webp" },
  { nombre: "Galletas", archivo: "Galletas.png" },
  { nombre: "Gatorade", archivo: "Gatorade.png" },
  { nombre: "Gel Black Rolda", archivo: "Gel black Rolda.jpg" },
  { nombre: "Ginger", archivo: "Ginger.jpg" },
  { nombre: "Jugo del Valle", archivo: "Jugo del valle.webp" },
  { nombre: "Maní", archivo: "Maní.png" },
  { nombre: "Mascarilla Black Mask", archivo: "Mascarilla Black Mask.avif" },
  { nombre: "Minoxidil 5%", archivo: "Minoxidil 5%.png" },
  { nombre: "NatuChips", archivo: "NatuChips.webp" },
  { nombre: "Papa Margarita", archivo: "papa-margarita.jpg" },
  { nombre: "Pony Malta", archivo: "pony_Malta.png" },
  { nombre: "Quatro", archivo: "Quatro.avif" },
  { nombre: "Sporade", archivo: "Sporade.webp" },
  { nombre: "Vive 100", archivo: "Vive 100.webp" },
];

export default function CatalogoPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-xl">
        <h2 className="font-serif text-headline-md text-on-surface mb-xs">Catálogo de Productos</h2>
        <p className="text-on-surface-variant font-sans text-sm">{productos.length} productos disponibles</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-md">
        {productos.map((p) => (
          <div
            key={p.archivo}
            className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl overflow-hidden flex flex-col items-center hover:border-primary transition-colors group"
          >
            <div className="w-full aspect-square relative bg-surface-container-high overflow-hidden">
              <Image
                src={`/imagenes/${encodeURIComponent(p.archivo)}`}
                alt={p.nombre}
                fill
                className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                unoptimized
              />
            </div>
            <div className="w-full px-3 py-2 border-t border-[#2A2A2A]">
              <p className="font-sans text-xs font-semibold text-on-surface text-center leading-tight truncate">
                {p.nombre}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
