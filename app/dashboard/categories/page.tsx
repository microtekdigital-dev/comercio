"use client";

import { useState, useEffect } from "react";
import { getCategories } from "@/lib/actions/categories";
import { getUserPermissions } from "@/lib/utils/permissions";
import { Plus, FolderTree, Loader2 } from "lucide-react";
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

  return (
    <div className="space-y-3 text-black select-none">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">

        {/* Title bar */}
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
          <span className="text-white text-sm font-bold">🗂 Categorías ({categories.length})</span>
          {canCreate && (
            <Link href="/dashboard/categories/new" className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 text-black">
              <Plus className="h-3 w-3" /> Nueva
            </Link>
          )}
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[30px_1fr_200px_80px_80px] border-b-2 border-[#808080] bg-[#d4d0c8]">
          {["#", "Nombre", "Descripción", "Estado", ""].map((h, i) => (
            <div key={i} className="text-xs font-bold px-2 py-1 border-r border-[#808080] last:border-r-0">{h}</div>
          ))}
        </div>

        {/* Table body */}
        <div className="bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-500">
              <FolderTree className="h-10 w-10 opacity-30" />
              <p className="text-sm">No hay categorías</p>
              {canCreate && (
                <Link href="/dashboard/categories/new" className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 mt-2 text-black">
                  <Plus className="h-3 w-3" /> Nueva Categoría
                </Link>
              )}
            </div>
          ) : (
            categories.map((category, idx) => (
              <div key={category.id} className={`grid grid-cols-[30px_1fr_200px_80px_80px] border-b border-[#e0e0e0] hover:bg-[#000080] hover:text-white group text-black ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}>
                <div className="px-2 py-1.5 text-xs text-center border-r border-[#e0e0e0] group-hover:border-[#3333aa] text-gray-400 group-hover:text-gray-300">
                  {idx + 1}
                </div>
                <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa] flex items-center gap-2">
                  {category.color && (
                    <div className="w-3 h-3 rounded-full shrink-0 border border-[#808080]" style={{ backgroundColor: category.color }} />
                  )}
                  <span className="font-semibold truncate">{category.name}</span>
                </div>
                <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate text-gray-600 group-hover:text-gray-200">
                  {category.description ?? "—"}
                </div>
                <div className="px-2 py-1.5 text-xs text-center border-r border-[#e0e0e0] group-hover:border-[#3333aa]">
                  <span className={category.is_active ? "text-green-700 group-hover:text-green-300 font-bold" : "text-red-600 group-hover:text-red-300"}>
                    {category.is_active ? "Activa" : "Inactiva"}
                  </span>
                </div>
                <div className="px-2 py-1.5 text-xs text-center">
                  <Link href={`/dashboard/categories/${category.id}`} className="text-[#000080] group-hover:text-white underline">
                    Editar
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
