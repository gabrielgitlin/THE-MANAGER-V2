import { supabase } from './supabase';

interface SendTicketEmailParams {
  guestId: string;
  guestName: string;
  guestEmail: string;
  showTitle: string;
  venueName: string;
  showDate: string;
  showTime: string;
  quantity: number;
  guestType: string;
}

export async function sendTicketEmail(params: SendTicketEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration is missing');
    }

    const functionUrl = `${supabaseUrl}/functions/v1/send-ticket-email`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        guestName: params.guestName,
        guestEmail: params.guestEmail,
        showTitle: params.showTitle,
        venueName: params.venueName,
        showDate: params.showDate,
        showTime: params.showTime,
        quantity: params.quantity,
        guestType: params.guestType,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send email');
    }

    if (result.success) {
      await supabase
        .from('guest_list')
        .update({ tickets_sent: true, updated_at: new Date().toISOString() })
        .eq('id', params.guestId);
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending ticket email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

export function validateEmailAddress(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function extractEmailFromContactInfo(contactInfo: string): string | null {
  if (!contactInfo) return null;

  const emailRegex = /([^\s@]+@[^\s@]+\.[^\s@]+)/;
  const match = contactInfo.match(emailRegex);

  return match ? match[1] : null;
}
