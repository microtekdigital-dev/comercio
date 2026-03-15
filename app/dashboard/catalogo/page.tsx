import {
  getCatalogoConfig,
  getProductosParaCatalogo,
  getPedidosOnline,
} from "@/lib/actions/catalogo";
import { ConfigCatalogo } from "@/components/dashboard/catalogo/config-catalogo";
import { ProductosPublicadosTable } from "@/components/dashboard/catalogo/productos-publicados-table";
import { PedidosOnlineTable } from "@/components/dashboard/catalogo/pedidos-online-table";

export default async function CatalogoPage() {
  const [config, productos, pedidos] = await Promise.all([
    getCatalogoConfig(),
    getProductosParaCatalogo(),
    getPedidosOnline(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Catálogo Online</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gestioná tu catálogo público y los pedidos recibidos.
        </p>
      </div>

      <ConfigCatalogo
        settings={config?.settings ?? null}
        planTier={config?.planTier ?? "basico"}
        catalogUrl={config?.catalogUrl ?? null}
      />

      <ProductosPublicadosTable productos={productos} />

      <PedidosOnlineTable pedidos={pedidos} />
    </div>
  );
}
