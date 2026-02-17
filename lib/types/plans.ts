/**
 * Interfaz para permisos de funcionalidades
 */
export interface FeaturePermission {
  allowed: boolean;
  requiredPlan?: string;
  message?: string;
}

/**
 * Interfaz para funcionalidades de navegación
 */
export interface NavigationFeature {
  href: string;
  label: string;
  icon: any;
  permission: FeaturePermission;
}
