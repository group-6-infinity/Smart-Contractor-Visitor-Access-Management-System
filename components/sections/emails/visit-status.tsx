type VisitEmailParams = {
  fullName: string;
  purpose: string;
  visitDateStr: string;
  trackingUrl: string;
  token?: string;
  reason?: string;
};

export function visitApprovedEmailTemplate({
  fullName,
  purpose,
  visitDateStr,
  trackingUrl,
  token,
}: VisitEmailParams): string {
  return `
  <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background: #f5f4f0; border-radius: 12px; overflow: hidden;">
    <div style="background: #1a1a1a; padding: 28px 24px;">
      <h1 style="margin: 0; color: #fff; font-size: 20px;">SecureGate</h1>
    </div>
    <div style="padding: 28px 24px;">
      <div style="display: inline-block; background: #dcfce7; color: #166534; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 600; margin-bottom: 16px;">
        ✓ Visit Approved
      </div>
      <p style="color: #1a1a1a; font-size: 15px;">Hi ${fullName},</p>
      <p style="color: #444; font-size: 15px; line-height: 1.6;">
        Good news! Your visit request has been <strong>approved</strong>.
      </p>

      <div style="background: #fff; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 8px; color: #666; font-size: 13px;">PURPOSE</p>
        <p style="margin: 0 0 16px; color: #1a1a1a; font-weight: 600;">${purpose}</p>
        <p style="margin: 0 0 8px; color: #666; font-size: 13px;">VISIT DATE</p>
        <p style="margin: 0; color: #1a1a1a; font-weight: 600;">${visitDateStr}</p>
      </div>

      <!-- QR Gate Pass -->
      <div style="background: #fff; border-radius: 8px; padding: 24px; margin: 16px 0; text-align: center;">
        <p style="margin: 0 0 16px; color: #1a1a1a; font-weight: 600;">Your Gate Pass</p>
        <img src="cid:gatepassqr" alt="Gate Pass QR" width="220" height="220" style="display: block; margin: 0 auto; border-radius: 8px;" />
        ${
          token
            ? `<p style="margin: 12px 0 0; color: #666; font-family: monospace; font-size: 13px;">${token}</p>`
            : ""
        }
        <p style="margin: 12px 0 0; color: #666; font-size: 13px;">
          Show this QR at the gate scanner on your visit day.
        </p>
      </div>

      <p style="color: #444; font-size: 14px; line-height: 1.6;">
        You can also access your gate pass anytime here:
      </p>
      <a href="${trackingUrl}" style="display: inline-block; background: #d97757; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 4px;">
        View Gate Pass
      </a>

      <p style="color: #999; font-size: 12px; margin-top: 28px;">
        SecureGate · Smart Contractor &amp; Visitor Access Management
      </p>
    </div>
  </div>
  `;
}

export function visitRejectedEmailTemplate({
  fullName,
  purpose,
  visitDateStr,
  trackingUrl,
  reason,
}: VisitEmailParams): string {
  return `
  <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background: #f5f4f0; border-radius: 12px; overflow: hidden;">
    <div style="background: #1a1a1a; padding: 28px 24px;">
      <h1 style="margin: 0; color: #fff; font-size: 20px;">SecureGate</h1>
    </div>
    <div style="padding: 28px 24px;">
      <div style="display: inline-block; background: #fee2e2; color: #991b1b; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 600; margin-bottom: 16px;">
        Visit Not Approved
      </div>
      <p style="color: #1a1a1a; font-size: 15px;">Hi ${fullName},</p>
      <p style="color: #444; font-size: 15px; line-height: 1.6;">
        Your visit request for <strong>"${purpose}"</strong> on <strong>${visitDateStr}</strong>
        was reviewed and could not be approved at this time.
      </p>
      ${
        reason
          ? `<div style="background: #fff; border-left: 3px solid #991b1b; border-radius: 6px; padding: 14px 16px; margin: 16px 0;">
               <p style="margin: 0 0 4px; color: #666; font-size: 13px;">REASON</p>
               <p style="margin: 0; color: #1a1a1a;">${reason}</p>
             </div>`
          : ""
      }
      <p style="color: #444; font-size: 15px; line-height: 1.6;">
        You may submit a new visit request through your tracking page.
      </p>
      <a href="${trackingUrl}" style="display: inline-block; background: #d97757; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">
        View Status
      </a>
      <p style="color: #999; font-size: 12px; margin-top: 28px;">
        SecureGate · Smart Contractor &amp; Visitor Access Management
      </p>
    </div>
  </div>
  `;
}
