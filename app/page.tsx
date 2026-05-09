import Link from "next/link"
import { ArrowRight, Star } from "lucide-react"

const FEATURES = [
  { icon: "📦", title: "Control de Inventario", desc: "Gestiona productos, categorías y stock en tiempo real. Alertas de stock bajo automáticas." },
  { icon: "🛒", title: "Ventas y Facturación", desc: "Registra ventas rápidamente, genera facturas y llevá el control de clientes y pagos." },
  { icon: "📊", title: "Reportes y Análisis", desc: "Visualizá el rendimiento de tu negocio con reportes detallados basados en datos reales." },
]

const BENEFITS = [
  "Sin inversión inicial — pagá solo por lo que usás",
  "Actualizaciones automáticas sin costo adicional",
  "Acceso desde cualquier lugar con internet",
  "Respaldos automáticos de tus datos",
  "Escala con tu negocio cuando lo necesites",
  "Soporte técnico incluido en todos los planes",
  "Comenzá en minutos, sin instalaciones",
  "Seguridad de nivel bancario",
  "Múltiples usuarios con distintos accesos",
  "Cancelá cuando quieras, sin contratos",
]

const TESTIMONIALS = [
  { initials: "MC", name: "María Contreras", biz: "Bazar Lili, Buenos Aires", text: "Antes llevaba todo en cuadernos. Ahora veo mi inventario en tiempo real y sé exactamente qué productos se venden más." },
  { initials: "JR", name: "Juan Rodríguez", biz: "Ferretería El Tornillo, Córdoba", text: "Puedo acceder desde mi celular cuando estoy fuera. Mis empleados registran ventas y yo veo todo en tiempo real." },
  { initials: "AS", name: "Andrea Silva", biz: "Librería Mundo Papel, Rosario", text: "En menos de una hora ya estaba cargando productos y haciendo ventas. El soporte responde rápido." },
  { initials: "PM", name: "Pedro Morales", biz: "Minimarket Don Pedro, Mendoza", text: "Tengo dos locales y ahora controlo el stock de ambos desde un solo lugar. Me ahorra muchísimo tiempo." },
  { initials: "LG", name: "Laura González", biz: "Boutique Elegancia, Mar del Plata", text: "Los reportes me ayudan a tomar mejores decisiones. Las facturas se generan automáticamente." },
  { initials: "CF", name: "Carlos Fuentes", biz: "Repuestos Automotriz CF, Tucumán", text: "El más completo por el precio. Inventario, ventas, clientes, proveedores. Y no necesito instalar nada." },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#008080] font-sans text-black">

      {/* Header */}
      <header className="bg-[#000080] border-b-2 border-[#808080]">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white text-base font-bold">🏢 Sistema de Gestión para Comercios</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]">
              Iniciar sesión
            </Link>
            <Link href="/auth/sign-up" className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]">
              Comenzar gratis
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Hero window */}
        <div className="border-2 border-[#808080] shadow-[4px_4px_0px_#000] bg-[#d4d0c8]">
          <div className="bg-[#000080] px-3 py-1">
            <span className="text-white text-sm font-bold">🚀 Bienvenido al Sistema de Gestión</span>
          </div>
          <div className="p-8 text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-black leading-tight">
              ¿No sabés cuánto ganás<br />
              <span className="text-[#000080]">realmente cada día?</span>
            </h1>
            <p className="text-sm text-gray-700 max-w-xl mx-auto">
              Entrá ahora, probá 14 días sin costo y empezá a ver tus resultados hoy mismo.<br />
              <span className="font-bold">Sin tarjeta · Sin contratos · Fácil desde el primer minuto</span>
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link href="/auth/sign-up"
                className="border-2 border-[#808080] bg-[#d4d0c8] px-6 py-2 text-sm font-bold shadow-[3px_3px_0px_#808080] active:shadow-none hover:bg-[#c0c0c0] flex items-center gap-2">
                Iniciar prueba gratuita <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/auth/login"
                className="border border-[#808080] bg-[#d4d0c8] px-4 py-2 text-sm font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]">
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000] bg-[#d4d0c8]">
          <div className="bg-[#000080] px-3 py-1">
            <span className="text-white text-sm font-bold">⚙ Funcionalidades Principales</span>
          </div>
          <div className="p-4 grid md:grid-cols-3 gap-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080] p-4">
                <div className="text-2xl mb-2">{f.icon}</div>
                <h3 className="text-sm font-bold mb-1">{f.title}</h3>
                <p className="text-xs text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000] bg-[#d4d0c8]">
          <div className="bg-[#000080] px-3 py-1">
            <span className="text-white text-sm font-bold">✅ ¿Por qué elegir un sistema en la nube?</span>
          </div>
          <div className="p-4 grid md:grid-cols-2 gap-2">
            {BENEFITS.map((b, i) => (
              <div key={i} className="flex items-start gap-2 border border-[#808080] bg-white px-3 py-2 shadow-[inset_1px_1px_2px_#808080]">
                <span className="text-green-700 font-bold text-xs shrink-0 mt-0.5">✔</span>
                <span className="text-xs">{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000] bg-[#d4d0c8]">
          <div className="bg-[#000080] px-3 py-1">
            <span className="text-white text-sm font-bold">⭐ Lo que dicen nuestros clientes</span>
          </div>
          <div className="p-4 grid md:grid-cols-3 gap-3">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080] p-3 space-y-2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, j) => <Star key={j} className="h-3 w-3 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-xs text-gray-700 italic">"{t.text}"</p>
                <div className="flex items-center gap-2 pt-1 border-t border-[#e0e0e0]">
                  <div className="w-7 h-7 bg-[#000080] text-white flex items-center justify-center text-[10px] font-bold border border-[#808080]">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-xs font-bold">{t.name}</div>
                    <div className="text-[10px] text-gray-500">{t.biz}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000] bg-[#d4d0c8]">
          <div className="bg-[#000080] px-3 py-1">
            <span className="text-white text-sm font-bold">🎯 Comenzá hoy</span>
          </div>
          <div className="p-6 text-center space-y-3">
            <p className="text-sm font-bold">14 días gratis · Sin tarjeta · Sin contratos</p>
            <Link href="/auth/sign-up"
              className="inline-flex items-center gap-2 border-2 border-[#808080] bg-[#d4d0c8] px-8 py-2.5 text-sm font-bold shadow-[3px_3px_0px_#808080] active:shadow-none hover:bg-[#c0c0c0]">
              Crear cuenta gratis <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="bg-[#000080] border-t-2 border-[#808080] py-3 mt-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-blue-200">
          © {new Date().getFullYear()} Sistema de Gestión para Comercios. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  )
}
