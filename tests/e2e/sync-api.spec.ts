import { test, expect } from "@playwright/test";

test.describe("Sync API", () => {
  test("POST /api/aft/sync sin body devuelve 400", async ({ request }) => {
    const r = await request.post("/api/aft/sync");
    expect(r.status()).toBe(400);
    const body = await r.json();
    expect(body.error).toContain("required");
  });

  test("POST /api/aft/sync sin auth devuelve 401", async ({ request }) => {
    const r = await request.post("/api/aft/sync", {
      data: { control_id: "00000000-0000-0000-0000-000000000001", mbs: ["MB001"] },
    });
    expect(r.status()).toBe(401);
    const body = await r.json();
    expect(body.error).toBe("unauthorized");
  });
});
