import { getPlanUsage } from "@/lib/utils/plan-limits";
import { getCurrentUser } from "@/lib/actions/users";
import { PlanUsage } from "./plan-usage";

export async function PlanUsageServer() {
  const user = await getCurrentUser();
  
  if (!user?.company_id) {
    return null;
  }

  const usage = await getPlanUsage(user.company_id);

  if (!usage) {
    return null;
  }

  return <PlanUsage usage={usage} />;
}
