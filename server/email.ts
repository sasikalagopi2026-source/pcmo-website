export type EmailPayload = {
  subject: string;
  text: string;
  html: string;
};

export type WelcomeEmailPayload = EmailPayload;
export type PurchaseConfirmationEmailPayload = EmailPayload;

const amp = String.fromCharCode(38);
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, amp + "lt;")
    .replace(/>/g, amp + "gt;")
    .replace(/\u0022/g, amp + "quot;")
    .replace(/\u0027/g, amp + "#39;");

const wrap = (title: string, bodyHtml: string, footer = "You received this email because you have an account or active relationship with PCMO.") => `
  <div style="background-color:#f4f6f9;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.6;">
    <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background-color:#0b3c78;padding:20px 28px;">
        <h1 style="margin:0;font-size:20px;color:#ffffff;">PCMO</h1>
        <p style="margin:4px 0 0;font-size:12px;color:#cbd5e1;">Project & Contracts Management Organisation</p>
      </div>
      <div style="padding:28px;">
        <h2 style="margin:0 0 16px;font-size:19px;color:#0b3c78;">${escapeHtml(title)}</h2>
        ${bodyHtml}
      </div>
      <div style="background-color:#f8fafc;padding:16px 28px;font-size:12px;color:#64748b;">
        <p style="margin:0 0 8px;">${escapeHtml(footer)}</p>
        <p style="margin:0;">PCMO ┬À Project & Contracts Management Organisation</p>
      </div>
    </div>
  </div>
`;

const button = (label: string, url: string) =>
  `<p style="margin:16px 0;"><a href="${escapeHtml(url)}" style="display:inline-block;background-color:#0b3c78;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-size:14px;">${escapeHtml(label)}</a></p>`;

export const buildWelcomeEmailPayload = ({
  displayName,
  supportEmail,
  clientUrl,
}: {
  displayName: string;
  supportEmail: string;
  clientUrl?: string;
}): WelcomeEmailPayload => {
  const name = displayName?.trim() || "there";
  const text = [
    `Hi ${name},`,
    "",
    "Welcome to PCMO! Your account is now ready for you to explore membership resources, learning content, and the community.",
    clientUrl ? `\nGet started: ${clientUrl}` : "",
    `If you need help getting started, reply to this email or contact ${supportEmail}.`,
    "",
    "Thanks,",
    "The PCMO team",
  ].filter(Boolean).join("\n");

  const html = wrap(
    "Welcome to PCMO",
    `<p style="margin:0 0 12px;">Hi ${escapeHtml(name)},</p>
     <p style="margin:0 0 12px;">Your account is now ready. You can explore membership resources, learning content, and the PCMO community right away.</p>
     ${clientUrl ? button("Explore PCMO", clientUrl) : ""}
     <p style="margin:0 0 12px;">Need help getting started? Contact <a href="mailto:${escapeHtml(supportEmail)}" style="color:#1a73e8;text-decoration:none;">${escapeHtml(supportEmail)}</a>.</p>
     <p style="margin:0;">Thanks,<br />The PCMO team</p>`,
  );

  return { subject: "Welcome to PCMO", text, html };
};

export const buildPurchaseConfirmationEmailPayload = ({
  displayName,
  itemName,
  amount,
  currency,
  orderNumber,
  receiptNumber,
  supportEmail,
}: {
  displayName: string;
  itemName: string;
  amount: number;
  currency: string;
  orderNumber: string;
  receiptNumber: string;
  supportEmail: string;
}): PurchaseConfirmationEmailPayload => {
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

  const html = wrap(
    "Purchase confirmation",
    `<p style="margin:0 0 12px;">Hi ${escapeHtml(name)},</p>
     <p style="margin:0 0 12px;">Your purchase of <strong>${escapeHtml(itemName)}</strong> is confirmed.</p>
     <table style="border-collapse:collapse;width:100%;max-width:420px;margin:0 0 12px;font-size:14px;">
       <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Order number</td><td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(orderNumber)}</td></tr>
       <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Receipt number</td><td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(receiptNumber)}</td></tr>
       <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Amount paid</td><td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(amountLabel)}</td></tr>
     </table>
     <p style="margin:0 0 12px;">Need help with your order? Contact <a href="mailto:${escapeHtml(supportEmail)}" style="color:#1a73e8;text-decoration:none;">${escapeHtml(supportEmail)}</a>.</p>
     <p style="margin:0;">Thanks,<br />The PCMO team</p>`,
  );

  return { subject: `Purchase confirmation for ${itemName}`, text, html };
};

export const buildNewsletterConfirmationEmailPayload = ({
  email,
  supportEmail,
}: {
  email: string;
  supportEmail: string;
}): EmailPayload => {
  const text = [
    "Hi there,",
    "",
    `You are now subscribed to the PCMO newsletter at ${email}.`,
    "You will receive the latest industry news, events, and opportunities.",
    "",
    "If you did not request this, you can ignore this email or contact us.",
    supportEmail ? `Contact: ${supportEmail}` : "",
    "",
    "Thanks,",
    "The PCMO team",
  ].filter(Boolean).join("\n");

  const html = wrap(
    "Newsletter subscription confirmed",
    `<p style="margin:0 0 12px;">Hi there,</p>
     <p style="margin:0 0 12px;">You are now subscribed to the PCMO newsletter at <strong>${escapeHtml(email)}</strong>.</p>
     <p style="margin:0 0 12px;">You will receive the latest industry news, events, and opportunities.</p>
     <p style="margin:0 0 12px;">If you did not request this, you can ignore this email or contact us.</p>
     ${supportEmail ? `<p style="margin:0;">Contact: <a href="mailto:${escapeHtml(supportEmail)}" style="color:#1a73e8;text-decoration:none;">${escapeHtml(supportEmail)}</a></p>` : ""}`,
  );

  return { subject: "Newsletter subscription confirmed", text, html };
};

export const buildContactAcknowledgementEmailPayload = ({
  name,
  subject,
  supportEmail,
}: {
  name: string;
  subject: string;
  supportEmail: string;
}): EmailPayload => {
  const text = [
    `Hi ${name},`,
    "",
    `Thank you for contacting PCMO regarding "${subject}".`,
    "We have received your message and a member of our team will respond as soon as possible.",
    `For urgent matters, contact ${supportEmail}.`,
    "",
    "Thanks,",
    "The PCMO team",
  ].join("\n");

  const html = wrap(
    "We received your message",
    `<p style="margin:0 0 12px;">Hi ${escapeHtml(name)},</p>
     <p style="margin:0 0 12px;">Thank you for contacting PCMO regarding <strong>"${escapeHtml(subject)}"</strong>.</p>
     <p style="margin:0 0 12px;">We have received your message and a member of our team will respond as soon as possible.</p>
     ${supportEmail ? `<p style="margin:0;">For urgent matters, contact <a href="mailto:${escapeHtml(supportEmail)}" style="color:#1a73e8;text-decoration:none;">${escapeHtml(supportEmail)}</a>.</p>` : ""}`,
  );

  return { subject: "We received your message", text, html };
};

export const buildMembershipConfirmationEmailPayload = ({
  displayName,
  planName,
  billingPeriod,
  clientUrl,
  supportEmail,
}: {
  displayName: string;
  planName: string;
  billingPeriod?: string;
  clientUrl?: string;
  supportEmail?: string;
}): EmailPayload => {
  const name = displayName?.trim() || "there";
  const period = billingPeriod ? ` (${billingPeriod})` : "";
  const text = [
    `Hi ${name},`,
    "",
    `Your ${planName}${period} membership is confirmed. Welcome to the PCMO community!`,
    "Your membership benefits are now active.",
    clientUrl ? `Manage your membership: ${clientUrl}` : "",
    supportEmail ? `Questions? Contact ${supportEmail}.` : "",
    "",
    "Thanks,",
    "The PCMO team",
  ].filter(Boolean).join("\n");

  const html = wrap(
    "Membership confirmed",
    `<p style="margin:0 0 12px;">Hi ${escapeHtml(name)},</p>
     <p style="margin:0 0 12px;">Your <strong>${escapeHtml(planName)}${escapeHtml(period)}</strong> membership is confirmed. Welcome to the PCMO community!</p>
     <p style="margin:0 0 12px;">Your membership benefits are now active.</p>
     ${clientUrl ? button("View my membership", clientUrl) : ""}
     ${supportEmail ? `<p style="margin:0;">Questions? Contact <a href="mailto:${escapeHtml(supportEmail)}" style="color:#1a73e8;text-decoration:none;">${escapeHtml(supportEmail)}</a>.</p>` : ""}`,
  );

  return { subject: `Welcome to ${planName} membership`, text, html };
};

export const buildCourseEnrollmentEmailPayload = ({
  displayName,
  courseName,
  clientUrl,
  supportEmail,
}: {
  displayName: string;
  courseName: string;
  clientUrl?: string;
  supportEmail?: string;
}): EmailPayload => {
  const name = displayName?.trim() || "there";
  const text = [
    `Hi ${name},`,
    "",
    `You are now enrolled in "${courseName}".`,
    "You can begin the course and track your progress any time.",
    clientUrl ? `Open the course: ${clientUrl}` : "",
    supportEmail ? `Questions? Contact ${supportEmail}.` : "",
    "",
    "Best of luck,",
    "The PCMO team",
  ].filter(Boolean).join("\n");

  const html = wrap(
    "Course enrollment confirmed",
    `<p style="margin:0 0 12px;">Hi ${escapeHtml(name)},</p>
     <p style="margin:0 0 12px;">You are now enrolled in <strong>"${escapeHtml(courseName)}"</strong>.</p>
     <p style="margin:0 0 12px;">You can begin the course and track your progress any time.</p>
     ${clientUrl ? button("Open the course", clientUrl) : ""}
     ${supportEmail ? `<p style="margin:0;">Questions? Contact <a href="mailto:${escapeHtml(supportEmail)}" style="color:#1a73e8;text-decoration:none;">${escapeHtml(supportEmail)}</a>.</p>` : ""}`,
  );

  return { subject: `Enrolled: ${courseName}`, text, html };
};

export const buildCertificateIssuedEmailPayload = ({
  displayName,
  certificateTitle,
  credentialId,
  verifyUrl,
  clientUrl,
  supportEmail,
}: {
  displayName: string;
  certificateTitle: string;
  credentialId?: string;
  verifyUrl?: string;
  clientUrl?: string;
  supportEmail?: string;
}): EmailPayload => {
  const name = displayName?.trim() || "there";
  const text = [
    `Hi ${name},`,
    "",
    `Congratulations! Your certificate "${certificateTitle}" has been issued.`,
    credentialId ? `Credential ID: ${credentialId}` : "",
    verifyUrl ? `Verify it at: ${verifyUrl}` : "",
    clientUrl ? `View your certificates: ${clientUrl}` : "",
    supportEmail ? `Questions? Contact ${supportEmail}.` : "",
    "",
    "We are proud of you,",
    "The PCMO team",
  ].filter(Boolean).join("\n");

  const html = wrap(
    "Certificate issued",
    `<p style="margin:0 0 12px;">Hi ${escapeHtml(name)},</p>
     <p style="margin:0 0 12px;">Congratulations! Your certificate <strong>"${escapeHtml(certificateTitle)}"</strong> has been issued.</p>
     ${credentialId ? `<p style="margin:0 0 8px;"><strong>Credential ID:</strong> ${escapeHtml(credentialId)}</p>` : ""}
     ${verifyUrl ? `<p style="margin:0 0 8px;">Verify it at: <a href="${escapeHtml(verifyUrl)}" style="color:#1a73e8;text-decoration:none;">${escapeHtml(verifyUrl)}</a></p>` : ""}
     ${clientUrl ? button("View my certificates", clientUrl) : ""}
     ${supportEmail ? `<p style="margin:0;">Questions? Contact <a href="mailto:${escapeHtml(supportEmail)}" style="color:#1a73e8;text-decoration:none;">${escapeHtml(supportEmail)}</a>.</p>` : ""}`,
  );

  return { subject: `Certificate issued: ${certificateTitle}`, text, html };
};

export const buildAssessmentCompletionEmailPayload = ({
  displayName,
  courseName,
  score,
  passed,
  retakeUrl,
  supportEmail,
}: {
  displayName: string;
  courseName: string;
  score: number;
  passed: boolean;
  retakeUrl?: string;
  supportEmail?: string;
}): EmailPayload => {
  const name = displayName?.trim() || "there";
  const outcome = passed ? "You passed" : "You did not pass";
  const text = [
    `Hi ${name},`,
    "",
    `${outcome} the assessment for "${courseName}".`,
    `Score: ${Math.round(score)}%`,
    passed ? "Congratulations on this achievement!" : retakeUrl ? `You can retake the assessment: ${retakeUrl}` : "",
    supportEmail ? `Questions? Contact ${supportEmail}.` : "",
    "",
    "The PCMO team",
  ].filter(Boolean).join("\n");

  const html = wrap(
    passed ? "Assessment passed" : "Assessment result",
    `<p style="margin:0 0 12px;">Hi ${escapeHtml(name)},</p>
     <p style="margin:0 0 12px;"><strong>${passed ? "Congratulations, you passed" : "You did not pass"}</strong> the assessment for <strong>"${escapeHtml(courseName)}"</strong>.</p>
     <p style="margin:0 0 12px;"><strong>Score:</strong> ${Math.round(score)}%</p>
     ${passed ? `<p style="margin:0 0 12px;">This is a great achievement. Your certificate is on its way!</p>` : retakeUrl ? `<p style="margin:0 0 12px;">You can retake the assessment: <a href="${escapeHtml(retakeUrl)}" style="color:#1a73e8;text-decoration:none;">Retake assessment</a></p>` : ""}
     ${supportEmail ? `<p style="margin:0;">Questions? Contact <a href="mailto:${escapeHtml(supportEmail)}" style="color:#1a73e8;text-decoration:none;">${escapeHtml(supportEmail)}</a>.</p>` : ""}`,
  );

  return { subject: passed ? `Assessment passed: ${courseName}` : `Assessment result: ${courseName}`, text, html };
};

export const buildPasswordResetEmailPayload = ({
  displayName,
  resetUrl,
  supportEmail,
}: {
  displayName: string;
  resetUrl: string;
  supportEmail?: string;
}): EmailPayload => {
  const name = displayName?.trim() || "there";
  const text = [
    `Hi ${name},`,
    "",
    "We received a request to reset your PCMO password.",
    `Use this link to set a new password (valid for 30 minutes): ${resetUrl}`,
    "If you did not request a password reset, you can safely ignore this email.",
    supportEmail ? `Need help? Contact ${supportEmail}.` : "",
    "",
    "The PCMO team",
  ].filter(Boolean).join("\n");

  const html = wrap(
    "Password reset request",
    `<p style="margin:0 0 12px;">Hi ${escapeHtml(name)},</p>
     <p style="margin:0 0 12px;">We received a request to reset your PCMO password.</p>
     ${button("Reset my password", resetUrl)}
     <p style="margin:0 0 12px;font-size:13px;color:#64748b;">This link is valid for 30 minutes. If you did not request a password reset, you can safely ignore this email.</p>
     ${supportEmail ? `<p style="margin:0;">Need help? Contact <a href="mailto:${escapeHtml(supportEmail)}" style="color:#1a73e8;text-decoration:none;">${escapeHtml(supportEmail)}</a>.</p>` : ""}`,
  );

  return { subject: "Reset your PCMO password", text, html };
};

export const buildOtpEmailPayload = ({
  displayName,
  code,
  expiresInMinutes = 10,
  supportEmail,
}: {
  displayName: string;
  code: string;
  expiresInMinutes?: number;
  supportEmail?: string;
}): EmailPayload => {
  const name = displayName?.trim() || "there";
  const text = [
    `Hi ${name},`,
    "",
    `Your PCMO verification code is: ${code}`,
    `This code is valid for ${expiresInMinutes} minutes. Do not share it with anyone.`,
    supportEmail ? `If you did not request this code, contact ${supportEmail}.` : "",
    "",
    "The PCMO team",
  ].filter(Boolean).join("\n");

  const html = wrap(
    "Your verification code",
    `<p style="margin:0 0 12px;">Hi ${escapeHtml(name)},</p>
     <p style="margin:0 0 12px;">Your PCMO verification code is:</p>
     <p style="margin:0 0 16px;font-size:28px;font-weight:bold;letter-spacing:6px;color:#0b3c78;">${escapeHtml(code)}</p>
     <p style="margin:0 0 12px;font-size:13px;color:#64748b;">This code is valid for ${expiresInMinutes} minutes. Do not share it with anyone.</p>
     ${supportEmail ? `<p style="margin:0;">If you did not request this code, contact <a href="mailto:${escapeHtml(supportEmail)}" style="color:#1a73e8;text-decoration:none;">${escapeHtml(supportEmail)}</a>.</p>` : ""}`,
  );

  return { subject: "Your PCMO verification code", text, html };
};

export const buildEventRegistrationEmailPayload = ({
  displayName,
  eventTitle,
  eventDate,
  eventTime,
  location,
  clientUrl,
  supportEmail,
}: {
  displayName: string;
  eventTitle: string;
  eventDate?: string;
  eventTime?: string;
  location?: string;
  clientUrl?: string;
  supportEmail?: string;
}): EmailPayload => {
  const name = displayName?.trim() || "there";
  const when = [eventDate, eventTime].filter(Boolean).join(" at ");
  const text = [
    `Hi ${name},`,
    "",
    `Your registration for "${eventTitle}" is confirmed.`,
    when ? `When: ${when}` : "",
    location ? `Where: ${location}` : "",
    clientUrl ? `View event details: ${clientUrl}` : "",
    supportEmail ? `Questions? Contact ${supportEmail}.` : "",
    "",
    "We look forward to seeing you,",
    "The PCMO team",
  ].filter(Boolean).join("\n");

  const html = wrap(
    "Event registration confirmed",
    `<p style="margin:0 0 12px;">Hi ${escapeHtml(name)},</p>
     <p style="margin:0 0 12px;">Your registration for <strong>"${escapeHtml(eventTitle)}"</strong> is confirmed.</p>
     ${when ? `<p style="margin:0 0 8px;"><strong>When:</strong> ${escapeHtml(when)}</p>` : ""}
     ${location ? `<p style="margin:0 0 8px;"><strong>Where:</strong> ${escapeHtml(location)}</p>` : ""}
     ${clientUrl ? button("View event details", clientUrl) : ""}
     ${supportEmail ? `<p style="margin:0;">Questions? Contact <a href="mailto:${escapeHtml(supportEmail)}" style="color:#1a73e8;text-decoration:none;">${escapeHtml(supportEmail)}</a>.</p>` : ""}`,
  );

  return { subject: `Registered: ${eventTitle}`, text, html };
};

export const buildPaymentSuccessEmailPayload = ({
  displayName,
  description,
  amount,
  currency,
  transactionId,
  clientUrl,
  supportEmail,
}: {
  displayName: string;
  description: string;
  amount: number;
  currency: string;
  transactionId: string;
  clientUrl?: string;
  supportEmail?: string;
}): EmailPayload => {
  const name = displayName?.trim() || "there";
  const amountLabel = `${currency.toUpperCase()} ${Number(amount || 0).toFixed(2)}`;
  const text = [
    `Hi ${name},`,
    "",
    `Your payment for "${description}" was successful.`,
    `Amount: ${amountLabel}`,
    `Transaction ID: ${transactionId}`,
    clientUrl ? `View your receipt: ${clientUrl}` : "",
    supportEmail ? `Questions? Contact ${supportEmail}.` : "",
    "",
    "Thanks,",
    "The PCMO team",
  ].filter(Boolean).join("\n");

  const html = wrap(
    "Payment successful",
    `<p style="margin:0 0 12px;">Hi ${escapeHtml(name)},</p>
     <p style="margin:0 0 12px;">Your payment for <strong>"${escapeHtml(description)}"</strong> was successful.</p>
     <table style="border-collapse:collapse;width:100%;max-width:420px;margin:0 0 12px;font-size:14px;">
       <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Amount</td><td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(amountLabel)}</td></tr>
       <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Transaction ID</td><td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(transactionId)}</td></tr>
     </table>
     ${clientUrl ? button("View receipt", clientUrl) : ""}
     ${supportEmail ? `<p style="margin:0;">Questions? Contact <a href="mailto:${escapeHtml(supportEmail)}" style="color:#1a73e8;text-decoration:none;">${escapeHtml(supportEmail)}</a>.</p>` : ""}`,
  );

  return { subject: `Payment confirmed: ${description}`, text, html };
};
