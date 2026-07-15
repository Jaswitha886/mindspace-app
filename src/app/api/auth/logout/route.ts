import { ok } from "@/lib/api";
import { destroySessionCookie } from "@/lib/auth";

export async function POST() {
  await destroySessionCookie();
  return ok(null, { message: "Logged out successfully" });
}
