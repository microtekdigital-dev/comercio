import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Building2, Users, Shield, Zap, ArrowRight } from "lucide-react"

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
            <span className="font-semibold text-lg">ERP SaaS</span>
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
          Sistema de Gestión para
          <br />
          <span className="text-muted-foreground">tu comercio PYME</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty">
          Controla tu inventario, ventas, compras y clientes desde un solo lugar. 
          La solución completa para hacer crecer tu negocio de forma organizada.
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

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ERP SaaS. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
