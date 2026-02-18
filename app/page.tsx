import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Users, Shield, Zap, ArrowRight, Check, Star } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">Sistema de gestión para comercios</span>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link href="/auth/login">Iniciar sesión</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Comenzar</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-balance">
          ¿No sabés cuánto ganás
          <br />
          <span className="text-muted-foreground">realmente cada día?</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty">
          Entrá ahora, probá 14 días sin costo y empezá a ver tus resultados hoy mismo
          <br />
          <span className="text-sm">Sin tarjeta • Sin contratos • Fácil de usar desde el primer minuto</span>
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/auth/sign-up">
              Iniciar prueba gratuita
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/auth/login">Iniciar sesión</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-lg border bg-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Control de Inventario</h3>
            <p className="text-muted-foreground">
              Gestiona tus productos, categorías y stock en tiempo real. 
              Recibe alertas de stock bajo y mantén tu inventario siempre actualizado.
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Ventas y Facturación</h3>
            <p className="text-muted-foreground">
              Registra ventas rápidamente, genera facturas profesionales y 
              lleva el control de tus clientes y pagos de forma sencilla.
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Reportes y Análisis</h3>
            <p className="text-muted-foreground">
              Visualiza el rendimiento de tu negocio con reportes detallados. 
              Toma decisiones informadas basadas en datos reales de tu comercio.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-24 bg-muted/30">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Por qué elegir un sistema en la nube?
          </h2>
          <p className="text-lg text-muted-foreground">
            Beneficios del modelo SaaS para tu comercio PYME
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="flex gap-3 p-4">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Sin inversión inicial</h4>
              <p className="text-sm text-muted-foreground">
                No necesitas comprar servidores ni licencias costosas. Paga solo por lo que usas con planes mensuales flexibles
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-4">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Actualizaciones automáticas</h4>
              <p className="text-sm text-muted-foreground">
                Siempre tendrás la última versión con nuevas funciones y mejoras sin costo adicional
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-4">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Acceso desde cualquier lugar</h4>
              <p className="text-sm text-muted-foreground">
                Gestiona tu negocio desde casa, la tienda o en movimiento. Solo necesitas internet
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-4">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Respaldos automáticos</h4>
              <p className="text-sm text-muted-foreground">
                Tus datos se respaldan automáticamente. Nunca perderás información importante
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-4">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Escala con tu negocio</h4>
              <p className="text-sm text-muted-foreground">
                Comienza con lo básico y agrega más funciones conforme tu negocio crece
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-4">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Soporte técnico incluido</h4>
              <p className="text-sm text-muted-foreground">
                No necesitas contratar personal de IT. Nosotros nos encargamos del mantenimiento
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-4">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Comienza en minutos</h4>
              <p className="text-sm text-muted-foreground">
                Regístrate y empieza a usar el sistema de inmediato. Sin instalaciones complicadas
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-4">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Seguridad empresarial</h4>
              <p className="text-sm text-muted-foreground">
                Protección de datos con encriptación y servidores seguros de nivel bancario
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-4">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Múltiples usuarios</h4>
              <p className="text-sm text-muted-foreground">
                Agrega empleados con diferentes niveles de acceso según sus responsabilidades
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-4">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Cancela cuando quieras</h4>
              <p className="text-sm text-muted-foreground">
                Sin contratos a largo plazo. Cancela tu suscripción en cualquier momento sin penalizaciones
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Planes que se adaptan a tu negocio
          </h2>
          <p className="text-lg text-muted-foreground">
            Comienza gratis y escala conforme creces. Sin sorpresas, sin costos ocultos.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Plan Básico */}
          <div className="rounded-lg border bg-card p-8 flex flex-col">
            <Badge className="w-fit mb-4 bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-500/20">
              14 días gratis
            </Badge>
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Básico</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold">$15.000</span>
                <span className="text-muted-foreground">/mes</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Perfecto para emprendedores y pequeños comercios
              </p>
            </div>
            
            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">Hasta 500 productos</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">Hasta 100 clientes</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">1 usuario</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">Gestión de inventario</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">Ventas y facturación</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">Reportes básicos</span>
              </li>
            </ul>
            
            <Button asChild className="w-full" variant="outline">
              <Link href="/auth/sign-up">Comenzar gratis</Link>
            </Button>
          </div>

          {/* Plan Profesional - Destacado */}
          <div className="rounded-lg border-2 border-primary bg-card p-8 flex flex-col relative">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
              Más popular
            </Badge>
            <Badge className="w-fit mb-4 bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-500/20">
              14 días gratis
            </Badge>
            
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Profesional</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold">$30.000</span>
                <span className="text-muted-foreground">/mes</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Ideal para comercios en crecimiento
              </p>
            </div>
            
            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">Hasta 2.000 productos</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">Hasta 500 clientes</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">Hasta 3 usuarios</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">Todo lo del plan Básico</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">Órdenes de compra</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">Gestión de proveedores</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">Reportes avanzados</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">Soporte prioritario</span>
              </li>
            </ul>
            
            <Button asChild className="w-full">
              <Link href="/auth/sign-up">Comenzar gratis</Link>
            </Button>
          </div>

          {/* Plan Empresarial */}
          <div className="rounded-lg border bg-card p-8 flex flex-col">
            <Badge className="w-fit mb-4 bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-500/20">
              14 días gratis
            </Badge>
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Empresarial</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold">$55.000</span>
                <span className="text-muted-foreground">/mes</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Para negocios establecidos con múltiples sucursales
              </p>
            </div>
            
            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">Productos ilimitados</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">Clientes ilimitados</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">Hasta 10 usuarios</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">Todo lo del plan Profesional</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">Múltiples sucursales</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">API de integración</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">Reportes personalizados</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">Soporte dedicado 24/7</span>
              </li>
            </ul>
            
            <Button asChild className="w-full" variant="outline">
              <Link href="/auth/sign-up">Comenzar gratis</Link>
            </Button>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary/10 border-2 border-primary/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <Check className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-lg">Prueba gratuita de 14 días</p>
              <p className="text-sm text-muted-foreground">Sin tarjeta de crédito. Cancela cuando quieras.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-24 bg-muted/30">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-lg text-muted-foreground">
            Comercios reales que han transformado su gestión con nuestro sistema
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Testimonio 1 */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm mb-4">
              "Antes llevaba todo en cuadernos y Excel. Ahora con este sistema puedo ver mi inventario en tiempo real y saber exactamente qué productos se venden más. Ha sido un cambio total para mi negocio."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold">MC</span>
              </div>
              <div>
                <p className="font-semibold text-sm">María Contreras</p>
                <p className="text-xs text-muted-foreground">Bazar Lili, Buenos Aires</p>
              </div>
            </div>
          </div>

          {/* Testimonio 2 */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm mb-4">
              "Lo mejor es que puedo acceder desde mi celular cuando estoy fuera de la tienda. Mis empleados registran las ventas y yo puedo ver todo en tiempo real. Muy recomendado para pequeños comercios."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold">JR</span>
              </div>
              <div>
                <p className="font-semibold text-sm">Juan Rodríguez</p>
                <p className="text-xs text-muted-foreground">Ferretería El Tornillo, Córdoba</p>
              </div>
            </div>
          </div>

          {/* Testimonio 3 */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm mb-4">
              "El sistema es muy fácil de usar. En menos de una hora ya estaba cargando mis productos y haciendo ventas. El soporte técnico responde rápido cuando tengo dudas. Excelente relación precio-calidad."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold">AS</span>
              </div>
              <div>
                <p className="font-semibold text-sm">Andrea Silva</p>
                <p className="text-xs text-muted-foreground">Librería Mundo Papel, Rosario</p>
              </div>
            </div>
          </div>

          {/* Testimonio 4 */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm mb-4">
              "Tengo dos locales y antes era un caos controlar el stock de ambos. Ahora puedo ver el inventario de las dos tiendas desde un solo lugar. Me ahorra muchísimo tiempo y evita errores."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold">PM</span>
              </div>
              <div>
                <p className="font-semibold text-sm">Pedro Morales</p>
                <p className="text-xs text-muted-foreground">Minimarket Don Pedro, Mendoza</p>
              </div>
            </div>
          </div>

          {/* Testimonio 5 */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm mb-4">
              "Los reportes me ayudan a tomar mejores decisiones. Puedo ver qué productos no se venden y cuáles necesito comprar más. Además, las facturas se generan automáticamente. Muy profesional."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold">LG</span>
              </div>
              <div>
                <p className="font-semibold text-sm">Laura González</p>
                <p className="text-xs text-muted-foreground">Boutique Elegancia, Mar del Plata</p>
              </div>
            </div>
          </div>

          {/* Testimonio 6 */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm mb-4">
              "Probé varios sistemas antes y este es el más completo por el precio. Tiene todo lo que necesito: inventario, ventas, clientes, proveedores. Y lo mejor es que no necesito instalar nada."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold">CF</span>
              </div>
              <div>
                <p className="font-semibold text-sm">Carlos Fuentes</p>
                <p className="text-xs text-muted-foreground">Repuestos Automotriz CF, Tucumán</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Sistema de gestión para comercios. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
