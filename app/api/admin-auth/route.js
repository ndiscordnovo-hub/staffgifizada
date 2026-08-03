// Verifies the admin passphrase against a server-side env var.
// The password is never shipped to the browser — only a yes/no comes back.
export const dynamic = "force-dynamic";

export async function POST(req) {
  let password = "";
  try {
    ({ password } = await req.json());
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  const expected = process.env.ADMIN_PASSWORD || "gifedition-admin";
  const ok = typeof password === "string" && password.length > 0 && password === expected;
  // Small delay to discourage brute forcing.
  await new Promise((r) => setTimeout(r, ok ? 0 : 500));
  return Response.json(
    { ok, usingDefault: !process.env.ADMIN_PASSWORD },
    { status: ok ? 200 : 401 }
  );
}
