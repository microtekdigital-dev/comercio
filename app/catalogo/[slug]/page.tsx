import { cache } from "react";
import { notFound } from "next/navigation";
import { getCatalogoPublico as _getCatalogoPublico } from "@/lib/actions/catalogo-publico";
import { CatalogoPublico } from "@/components/catalogo/catalogo-publico";

export const revalidate = 0;

// Cache per request to avoid double-fetching (page + generateMetadata)
const getCatalogoPublico = cache(_getCatalogoPublico);

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CatalogoPage({ params }: Props) {
  const { slug } = await params;
  const data = await getCatalogoPublico(slug);

  if (!data) {
    notFound();
  }

  return <CatalogoPublico data={data} />;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const data = await getCatalogoPublico(slug);

  if (!data) {
    return { title: "Catálogo no encontrado" };
  }

  return {
    title: `Catálogo de ${data.company.name}`,
    description: `Explorá los productos de ${data.company.name}`,
  };
}
