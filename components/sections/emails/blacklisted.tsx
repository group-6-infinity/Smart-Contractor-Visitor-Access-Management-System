export function blacklistEmailTemplate({
  fullName,
  reason,
}: {
  fullName: string;
  reason: string;
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

              <tr>
                <td style="background-color:#1a1a1a;padding:28px 32px;">
                  <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">SecureGate</h1>
                  <p style="margin:4px 0 0;color:#a1a1aa;font-size:13px;">Contractor &amp; Visitor Access Management</p>
                </td>
              </tr>

              <tr>
                <td style="padding:32px;">
                  <h2 style="margin:0 0 8px;font-size:18px;color:#1a1a1a;">Access Restriction Notice</h2>
                  <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#52525b;">
                    Dear <strong>${fullName}</strong>, we are writing to inform you that your access to our facility has been restricted. You will not be permitted entry at this time.
                  </p>

                  <div style="background-color:#fef2f2;border-left:3px solid #dc2626;border-radius:4px;padding:12px 16px;margin-bottom:20px;">
                    <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#a1a1aa;">Reason</p>
                    <p style="margin:0;font-size:14px;color:#1a1a1a;">${reason}</p>
                  </div>

                  <p style="margin:0;font-size:14px;line-height:1.6;color:#52525b;">
                    If you believe this is a mistake or would like to appeal this decision, please contact the facility's HSE department directly.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="background-color:#f5f4f0;padding:20px 32px;border-top:1px solid #e5e3dd;">
                  <p style="margin:0;font-size:12px;line-height:1.5;color:#a1a1aa;">
                    This is an automated notice from SecureGate. Please do not reply to this email.
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
