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
    <div className="space-y-4 text-black">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1">
          <span className="text-white text-sm font-bold">⚙ Configuración</span>
        </div>
        <div className="bg-[#d4d0c8] p-4 space-y-6">
          <ThemeSettings />
          <div className="border-t border-[#808080]" />
          <NotificationSettings />
          <div className="border-t border-[#808080]" />
          <ProfileSettings user={user} />
          {(user.role === "owner" || user.role === "admin") && company && (
            <>
              <div className="border-t border-[#808080]" />
              <CompanySettingsAdvanced company={company} onUpdate={updateCompanySettings} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
