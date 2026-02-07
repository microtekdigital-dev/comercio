"use client";

import { useState, useEffect } from "react";
import { getCategories } from "@/lib/actions/categories";
import { getUserPermissions } from "@/lib/utils/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderTree } from "lucide-react";
import Link from "next/link";
import type { Category } from "@/lib/types/erp";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [canCreate, setCanCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const permissions = await getUserPermissions();
    setCanCreate(permissions.canCreateCategories);
  };

  const loadCategories = async () => {
    const data = await getCategories();
    setCategories(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Categorías</h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Organiza tus productos con categorías
          </p>
        </div>
        {canCreate && (
          <Link href="/dashboard/categories/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Categoría
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <FolderTree className="h-5 w-5" />
            Lista de Categorías ({categories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <FolderTree className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-base md:text-lg font-semibold">No hay categorías</h3>
              <p className="text-muted-foreground text-sm md:text-base">
                Comienza agregando tu primera categoría
              </p>
              <Link href="/dashboard/categories/new" className="w-full sm:w-auto inline-block">
                <Button className="mt-4 w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Categoría
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="border rounded-lg p-3 md:p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2 md:mb-3">
                    <div className="flex items-center gap-2">
                      {category.color && (
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                      <h3 className="font-semibold text-sm md:text-base">{category.name}</h3>
                    </div>
                    <Badge variant={category.is_active ? "default" : "secondary"}>
                      {category.is_active ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>

                  {category.description && (
                    <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
                      {category.description}
                    </p>
                  )}

                  <div className="flex gap-2 mt-4 flex-col sm:flex-row">
                    <Link
                      href={`/dashboard/categories/${category.id}`}
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        Editar
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
