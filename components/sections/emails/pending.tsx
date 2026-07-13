export function pendingEmailTemplate({
  fullName,
  trackingToken,
  trackingUrl,
  type,
}: {
  fullName: string;
  trackingToken: string;
  trackingUrl: string;
  type: string;
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

              <!-- Body -->
              <tr>
                <td style="padding:32px;">
                  <h2 style="margin:0 0 8px;font-size:18px;color:#1a1a1a;">Registration Received</h2>
                  <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#52525b;">
                    Hi <strong>${fullName}</strong>, your ${type.toLowerCase()} registration has been received and is now under review by our HSE team.
                  </p>

                  <!-- Token box -->
                  <div style="background-color:#f5f4f0;border:1px dashed #d97757;border-radius:8px;padding:16px;text-align:center;margin-bottom:20px;">
                    <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#a1a1aa;">Your Tracking ID</p>
                    <p style="margin:0;font-size:22px;font-weight:700;letter-spacing:2px;color:#1a1a1a;font-family:monospace;">${trackingToken}</p>
                  </div>

                  <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#52525b;">
                    Use the button below to track your registration status. You'll need to verify your email to access it.
                  </p>

                  <!-- CTA -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${trackingUrl}" style="display:inline-block;background-color:#d97757;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 32px;border-radius:8px;">
                          Track My Registration
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
