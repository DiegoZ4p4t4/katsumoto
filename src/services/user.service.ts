import { supabase, getCurrentOrgId } from "@/lib/supabase";
import { auditService } from "@/services/audit.service";
import type { Profile, UserRole } from "@/lib/types";

export interface UserWithStats extends Profile {
  invoice_count?: number;
  last_activity?: string | null;
}

export const userService = {
  async getByOrg(): Promise<Profile[]> {
    const orgId = await getCurrentOrgId();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  },

  async updateRole(userId: string, role: UserRole): Promise<void> {
    const orgId = await getCurrentOrgId();
    const { data: current } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .eq("organization_id", orgId)
      .single();
    if (!current) throw new Error("Usuario no encontrado en la organización actual");
    const { error } = await supabase
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw error;
    auditService.log("role.change", "profile", userId, { role: current?.role }, { role });
  },

  async toggleActive(userId: string, isActive: boolean): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");
    if (userId === user.id) throw new Error("No puedes desactivarte a ti mismo");

    const { error } = await supabase
      .from("profiles")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw error;
  },

  async updateProfile(userId: string, fullName: string): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw error;
  },

  async inviteUser(email: string, fullName: string, role: UserRole): Promise<{ password: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const orgId = await getCurrentOrgId();

    const tempPassword = generateTempPassword();

    const { error } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        data: {
          full_name: fullName,
          organization_id: orgId,
          role,
        },
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        throw new Error("Este correo ya está registrado.");
      }
      throw new Error(error.message);
    }

    auditService.log("user.invite", "profile", undefined, undefined, { email, role });
    return { password: tempPassword };
  },
};

function generateTempPassword(): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#";
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  let pwd = "";
  for (let i = 0; i < 12; i++) {
    pwd += chars.charAt(array[i] % chars.length);
  }
  return pwd;
}
