export interface Profile {
  id: string;
  company_id: string | null;
  role: "owner" | "admin" | "member" | "employee" | string;
  created_at?: string;
}
