import { describe, expect, it } from "vitest";
import { buildPurchaseConfirmationEmailPayload, buildWelcomeEmailPayload } from "../../server/email";

describe("welcome email payload", () => {
  it("includes the member name and a helpful next step", () => {
    const payload = buildWelcomeEmailPayload({ displayName: "Ava", supportEmail: "support@pcmo.world" });

    expect(payload.subject).toContain("Welcome");
    expect(payload.text).toContain("Ava");
    expect(payload.text).toContain("support@pcmo.world");
    expect(payload.html).toContain("Ava");
  });
});

describe("purchase confirmation email payload", () => {
  it("includes the order details and receipt information", () => {
    const payload = buildPurchaseConfirmationEmailPayload({
      displayName: "Noah",
      itemName: "Premium Membership",
      amount: 149,
      currency: "USD",
      orderNumber: "STRIPE-123",
      receiptNumber: "INV-456",
      supportEmail: "billing@pcmo.world",
    });

    expect(payload.subject).toContain("Purchase confirmation");
    expect(payload.text).toContain("Premium Membership");
    expect(payload.text).toContain("149");
    expect(payload.text).toContain("INV-456");
    expect(payload.html).toContain("STRIPE-123");
  });
});
