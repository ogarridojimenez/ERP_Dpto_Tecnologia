"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null };

/**
 * Server action de login. La sesion se persiste via cookies HttpOnly
 * (@supabase/ssr setAll), por lo que el redirect server-side a /dashboard
 * encuentra la sesion ya instalada y el middleware no rebota al usuario
 * a /login. Esto elimina la race condition de router.refresh().
 */
export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Correo y contraseña son obligatorios" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  // redirect lanza una excepcion interna (NEXT_REDIRECT) que Next captura
  // y procesa. No envolver en try/catch.
  redirect("/dashboard");
}
