export function rejectedEmailTemplate({
  fullName,
  trackingToken,
  trackingUrl,
  type,
  reason,
}: {
  fullName: string;
  trackingToken: string;
  trackingUrl: string;
  type: string;
  reason?: string;
}) {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin:0;padding:0;background-color:#f5f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f4f0;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e3dd;">

              <!-- Header -->
              <tr>
                <td style="background-color:#1a1a1a;padding:28px 32px;">
                  <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">SecureGate</h1>
                  <p style="margin:4px 0 0;color:#a1a1aa;font-size:13px;">Contractor &amp; Visitor Access Management</p>
                </td>
              </tr>

              <!-- Status badge -->
              <tr>
                <td style="padding:32px 32px 0;">
                  <div style="display:inline-block;background-color:#fdecea;border:1px solid #e57373;border-radius:20px;padding:6px 14px;">
                    <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.5px;color:#c62828;text-transform:uppercase;">✕ Not Approved</p>
                  </div>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:20px 32px 32px;">
                  <h2 style="margin:0 0 8px;font-size:18px;color:#1a1a1a;">Registration Not Approved</h2>
                  <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#52525b;">
                    Hi <strong>${fullName}</strong>, after review by our HSE team, your ${type.toLowerCase()} registration was not approved at this time.
                  </p>

                  <!-- Reason box - always shown -->
                  <div style="background-color:#fdecea;border-left:4px solid #e57373;border-radius:6px;padding:16px 18px;margin-bottom:20px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#c62828;">Reason for Rejection</p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#3f3f46;">
                      ${reason && reason.trim() ? reason : "No specific reason was provided. Please contact our HSE team for more details."}
                    </p>
                  </div>

                  <!-- Token box -->
                  <div style="background-color:#f5f4f0;border:1px dashed #d1d1cb;border-radius:8px;padding:16px;text-align:center;margin-bottom:20px;">
                    <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#a1a1aa;">Your Tracking ID</p>
                    <p style="margin:0;font-size:22px;font-weight:700;letter-spacing:2px;color:#1a1a1a;font-family:monospace;">${trackingToken}</p>
                  </div>

                  <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#52525b;">
                    If you believe this was a mistake or would like to submit a new registration with updated information, please contact our HSE team or reapply through the link below.
                  </p>

                  <!-- CTA -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${trackingUrl}" style="display:inline-block;background-color:#d97757;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 32px;border-radius:8px;">
                          View Registration Details
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#a1a1aa;">
                    Or copy this link:<br/>
                    <a href="${trackingUrl}" style="color:#d97757;word-break:break-all;">${trackingUrl}</a>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color:#f5f4f0;padding:20px 32px;border-top:1px solid #e5e3dd;">
                  <p style="margin:0;font-size:12px;line-height:1.5;color:#a1a1aa;">
                    Keep your tracking ID safe. This is the only way to access your registration status and submit visit requests.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}
