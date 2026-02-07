import { getCurrentUser } from "@/lib/actions/users";
import { getCompanyInfo, updateCompanySettings } from "@/lib/actions/company";
import { ProfileSettings } from "@/components/dashboard/profile-settings";
import { CompanySettingsAdvanced } from "@/components/dashboard/company-settings-advanced";
import { ThemeSettings } from "@/components/dashboard/theme-settings";
import { NotificationSettings } from "@/components/dashboard/notification-settings";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const company = await getCompanyInfo();

  if (!user) return null;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tu perfil y configuración de la empresa
        </p>
      </div>

      <div className="grid gap-8 max-w-4xl">
        <ThemeSettings />
        <NotificationSettings />
        <ProfileSettings user={user} />
        {(user.role === "owner" || user.role === "admin") && company && (
          <CompanySettingsAdvanced 
            company={company} 
            onUpdate={updateCompanySettings}
          />
        )}
      </div>
    </div>
  );
}
