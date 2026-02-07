"use server";

import { createClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "employee";

export interface UserPermissions {
  canCreateProducts: boolean;
  canEditProducts: boolean;
  canDeleteProducts: boolean;
  canCreateCategories: boolean;
  canEditCategories: boolean;
  canDeleteCategories: boolean;
  canCreateSales: boolean;
  canEditSales: boolean;
  canDeleteSales: boolean;
  canCreateSuppliers: boolean;
  canEditSuppliers: boolean;
  canDeleteSuppliers: boolean;
  canCreateCustomers: boolean;
  canEditCustomers: boolean;
  canDeleteCustomers: boolean;
  canViewReports: boolean;
  canManageTeam: boolean;
  canManageSettings: boolean;
}

/**
 * Obtiene el perfil del usuario actual con su rol
 */
export async function getCurrentUserProfile() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, company_id, role, email, full_name")
    .eq("id", user.id)
    .single();

  return profile;
}

/**
 * Verifica si el usuario actual es admin
 */
export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  return profile?.role === "admin";
}

/**
 * Verifica si el usuario actual es employee
 */
export async function isEmployee(): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  return profile?.role === "employee";
}

/**
 * Obtiene los permisos del usuario actual basado en su rol
 */
export async function getUserPermissions(): Promise<UserPermissions> {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    // Usuario no autenticado - sin permisos
    return {
      canCreateProducts: false,
      canEditProducts: false,
      canDeleteProducts: false,
      canCreateCategories: false,
      canEditCategories: false,
      canDeleteCategories: false,
      canCreateSales: false,
      canEditSales: false,
      canDeleteSales: false,
      canCreateSuppliers: false,
      canEditSuppliers: false,
      canDeleteSuppliers: false,
      canCreateCustomers: false,
      canEditCustomers: false,
      canDeleteCustomers: false,
      canViewReports: false,
      canManageTeam: false,
      canManageSettings: false,
    };
  }

  if (profile.role === "admin") {
    // Admin tiene todos los permisos
    return {
      canCreateProducts: true,
      canEditProducts: true,
      canDeleteProducts: true,
      canCreateCategories: true,
      canEditCategories: true,
      canDeleteCategories: true,
      canCreateSales: true,
      canEditSales: true,
      canDeleteSales: true,
      canCreateSuppliers: true,
      canEditSuppliers: true,
      canDeleteSuppliers: true,
      canCreateCustomers: true,
      canEditCustomers: true,
      canDeleteCustomers: true,
      canViewReports: true,
      canManageTeam: true,
      canManageSettings: true,
    };
  }

  // Employee tiene permisos limitados
  return {
    canCreateProducts: false, // No puede crear productos
    canEditProducts: false, // No puede editar productos
    canDeleteProducts: false, // No puede eliminar productos
    canCreateCategories: false, // No puede crear categorías
    canEditCategories: false, // No puede editar categorías
    canDeleteCategories: false, // No puede eliminar categorías
    canCreateSales: true, // Puede crear ventas
    canEditSales: false, // No puede editar ventas
    canDeleteSales: false, // No puede eliminar ventas
    canCreateSuppliers: false, // No puede crear proveedores
    canEditSuppliers: false, // No puede editar proveedores
    canDeleteSuppliers: false, // No puede eliminar proveedores
    canCreateCustomers: true, // Puede crear clientes
    canEditCustomers: true, // Puede editar clientes
    canDeleteCustomers: false, // No puede eliminar clientes
    canViewReports: true, // Puede ver reportes
    canManageTeam: false, // No puede gestionar equipo
    canManageSettings: false, // No puede gestionar configuración
  };
}

/**
 * Verifica si el usuario tiene un permiso específico
 */
export async function checkPermission(
  permission: keyof UserPermissions
): Promise<boolean> {
  const permissions = await getUserPermissions();
  return permissions[permission];
}

/**
 * Lanza un error si el usuario no tiene el permiso requerido
 */
export async function requirePermission(
  permission: keyof UserPermissions
): Promise<void> {
  const hasPermission = await checkPermission(permission);
  if (!hasPermission) {
    throw new Error("No tienes permisos para realizar esta acción");
  }
}

/**
 * Verifica si el usuario es admin, lanza error si no lo es
 */
export async function requireAdmin(): Promise<void> {
  const admin = await isAdmin();
  if (!admin) {
    throw new Error("Solo los administradores pueden realizar esta acción");
  }
}
