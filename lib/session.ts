import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const COOKIE = "ajaia_uid";

// Lightweight demo auth: the session is just the signed-in user's id in an
// httpOnly cookie, resolved against the DB on read. Good enough to demonstrate
// ownership and sharing; not meant as real authentication.
export async function getCurrentUser() {
  const uid = (await cookies()).get(COOKIE)?.value;
  if (!uid) return null;
  return prisma.user.findUnique({ where: { id: uid } });
}

export async function setSession(userId: string) {
  (await cookies()).set(COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}
