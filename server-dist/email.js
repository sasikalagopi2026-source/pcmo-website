export const buildWelcomeEmailPayload = ({ displayName, supportEmail, }) => {
    const name = displayName?.trim() || "there";
    const text = [
        `Hi ${name},`,
        "",
        "Welcome to PCMO! Your account is now ready for you to explore membership resources, learning content, and the community.",
        "",
        `If you need help getting started, reply to this email or contact ${supportEmail}.`,
        "",
        "Thanks,",
        "The PCMO team",
    ].join("\n");
    const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.6;">
      <h2 style="margin:0 0 16px 0;font-size:20px;color:#0b3c78;">Welcome to PCMO</h2>
      <p style="margin:0 0 12px 0;">Hi ${name},</p>
      <p style="margin:0 0 12px 0;">Your account is now ready. You can explore membership resources, learning content, and the PCMO community right away.</p>
      <p style="margin:0 0 12px 0;">Need help getting started? Contact <a href="mailto:${supportEmail}" style="color:#1a73e8;text-decoration:none;">${supportEmail}</a>.</p>
      <p style="margin:0;font-size:12px;color:#666;">Thanks,<br />The PCMO team</p>
    </div>
  `;
    return {
        subject: "Welcome to PCMO",
        text,
        html,
    };
};
export const buildPurchaseConfirmationEmailPayload = ({ displayName, itemName, amount, currency, orderNumber, receiptNumber, supportEmail, }) => {
    const name = displayName?.trim() || "there";
    const amountLabel = `${currency.toUpperCase()} ${Number(amount).toFixed(2)}`;
    const text = [
        `Hi ${name},`,
        "",
        `Your purchase of ${itemName} is confirmed.`,
        `Order number: ${orderNumber}`,
        `Receipt number: ${receiptNumber}`,
        `Amount paid: ${amountLabel}`,
        "",
        `Need help with your order? Contact ${supportEmail}.`,
        "",
        "Thanks,",
        "The PCMO team",
    ].join("\n");
    const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.6;">
      <h2 style="margin:0 0 16px 0;font-size:20px;color:#0b3c78;">Purchase confirmation</h2>
      <p style="margin:0 0 12px 0;">Hi ${name},</p>
      <p style="margin:0 0 12px 0;">Your purchase of <strong>${itemName}</strong> is confirmed.</p>
      <p style="margin:0 0 8px 0;"><strong>Order number:</strong> ${orderNumber}</p>
      <p style="margin:0 0 8px 0;"><strong>Receipt number:</strong> ${receiptNumber}</p>
      <p style="margin:0 0 12px 0;"><strong>Amount paid:</strong> ${amountLabel}</p>
      <p style="margin:0 0 12px 0;">Need help with your order? Contact <a href="mailto:${supportEmail}" style="color:#1a73e8;text-decoration:none;">${supportEmail}</a>.</p>
      <p style="margin:0;font-size:12px;color:#666;">Thanks,<br />The PCMO team</p>
    </div>
  `;
    return {
        subject: "Purchase confirmation for your PCMO order",
        text,
        html,
    };
};
//# sourceMappingURL=email.js.map