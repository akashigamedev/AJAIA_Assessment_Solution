import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database so the authorization logic can be tested in isolation.
const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: { document: { findUnique } },
}));

import { getDocumentForUser, canEdit } from "@/lib/access";

describe("canEdit", () => {
  it("allows owners and editors, blocks viewers", () => {
    expect(canEdit("OWNER")).toBe(true);
    expect(canEdit("EDITOR")).toBe(true);
    expect(canEdit("VIEWER")).toBe(false);
  });
});

describe("getDocumentForUser", () => {
  beforeEach(() => findUnique.mockReset());

  it("returns null when the document does not exist", async () => {
    findUnique.mockResolvedValue(null);
    expect(await getDocumentForUser("doc1", "alice")).toBeNull();
  });

  it("grants OWNER to the document owner", async () => {
    findUnique.mockResolvedValue({ id: "doc1", ownerId: "alice", shares: [] });
    const access = await getDocumentForUser("doc1", "alice");
    expect(access?.role).toBe("OWNER");
    expect(canEdit(access!.role)).toBe(true);
  });

  it("grants the share role to a collaborator (EDITOR)", async () => {
    findUnique.mockResolvedValue({
      id: "doc1",
      ownerId: "alice",
      shares: [{ userId: "bob", role: "EDITOR" }],
    });
    const access = await getDocumentForUser("doc1", "bob");
    expect(access?.role).toBe("EDITOR");
    expect(canEdit(access!.role)).toBe(true);
  });

  it("grants read-only access to a VIEWER collaborator", async () => {
    findUnique.mockResolvedValue({
      id: "doc1",
      ownerId: "alice",
      shares: [{ userId: "carol", role: "VIEWER" }],
    });
    const access = await getDocumentForUser("doc1", "carol");
    expect(access?.role).toBe("VIEWER");
    expect(canEdit(access!.role)).toBe(false);
  });

  it("denies access to a user with no ownership or share", async () => {
    findUnique.mockResolvedValue({ id: "doc1", ownerId: "alice", shares: [] });
    expect(await getDocumentForUser("doc1", "stranger")).toBeNull();
  });
});
