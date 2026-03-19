import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TicketEmailRequest {
  guestName: string;
  guestEmail: string;
  showTitle: string;
  venueName: string;
  showDate: string;
  showTime: string;
  quantity: number;
  guestType: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured. Please add it to your Supabase Edge Function secrets.");
    }

    const body: TicketEmailRequest = await req.json();
    const { guestName, guestEmail, showTitle, venueName, showDate, showTime, quantity, guestType } = body;

    if (!guestEmail || !guestName) {
      throw new Error("Guest name and email are required");
    }

    const emailHtml = generateTicketEmail({
      guestName,
      showTitle,
      venueName,
      showDate,
      showTime,
      quantity,
      guestType,
    });

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "The Manager <noreply@themanager.app>",
        to: [guestEmail],
        subject: `Your tickets for ${showTitle}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`);
    }

    const result = await emailResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Ticket email sent successfully",
        emailId: result.id,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending ticket email:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

function generateTicketEmail(params: {
  guestName: string;
  showTitle: string;
  venueName: string;
  showDate: string;
  showTime: string;
  quantity: number;
  guestType: string;
}): string {
  const { guestName, showTitle, venueName, showDate, showTime, quantity, guestType } = params;

  const formattedDate = new Date(showDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Tickets</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #009C55 0%, #007a42 100%); padding: 40px 40px 80px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Your Tickets Are Ready!</h1>
            </td>
          </tr>

          <!-- Ticket Card -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="background: #ffffff; border: 2px solid #009C55; border-radius: 12px; margin-top: -50px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Guest</p>
                      <h2 style="color: #1a1a1a; margin: 0 0 20px; font-size: 24px; font-weight: 600;">${guestName}</h2>
                    </td>
                  </tr>
                  <tr>
                    <td style="border-top: 1px solid #e5e5e5; padding-top: 20px;">
                      <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Event</p>
                      <h3 style="color: #1a1a1a; margin: 0 0 8px; font-size: 20px; font-weight: 600;">${showTitle}</h3>
                      <p style="color: #666; margin: 0; font-size: 16px;">${venueName}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top: 20px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="50%" style="padding-right: 10px;">
                            <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Date</p>
                            <p style="color: #1a1a1a; margin: 0; font-size: 16px; font-weight: 500;">${formattedDate}</p>
                          </td>
                          <td width="50%" style="padding-left: 10px;">
                            <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Time</p>
                            <p style="color: #1a1a1a; margin: 0; font-size: 16px; font-weight: 500;">${showTime}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top: 20px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="50%" style="padding-right: 10px;">
                            <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Quantity</p>
                            <p style="color: #1a1a1a; margin: 0; font-size: 16px; font-weight: 500;">${quantity} ${quantity === 1 ? 'Ticket' : 'Tickets'}</p>
                          </td>
                          <td width="50%" style="padding-left: 10px;">
                            <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Type</p>
                            <p style="color: #1a1a1a; margin: 0; font-size: 16px; font-weight: 500; text-transform: capitalize;">${guestType.replace('_', ' ')}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Important Info -->
          <tr>
            <td style="padding: 30px 40px;">
              <h4 style="color: #1a1a1a; margin: 0 0 15px; font-size: 16px; font-weight: 600;">Important Information</h4>
              <ul style="color: #666; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li style="margin-bottom: 8px;">Please arrive 30 minutes before the show time</li>
                <li style="margin-bottom: 8px;">Bring a valid photo ID for entry</li>
                <li style="margin-bottom: 8px;">Your name will be on the guest list at the door</li>
                <li style="margin-bottom: 8px;">This email serves as your confirmation</li>
              </ul>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="color: #999; margin: 0; font-size: 14px;">
                Questions? Reply to this email or contact the venue directly.
              </p>
              <p style="color: #ccc; margin: 15px 0 0; font-size: 12px;">
                Sent by The Manager
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
