// Mailversand über Resend (https://resend.com), nur per fetch, ohne zusätzliches Paket.
// In Vercel-Vorschauen wird nie gesendet: Vorschauen arbeiten auf einer Kopie echter Daten.

interface Mail {
  to: string
  subject: string
  text: string
}

export async function sendMail(mail: Mail): Promise<void> {
  if (process.env.VERCEL_ENV === 'preview') {
    console.warn(`[mail] Vorschau: Versand an ${mail.to} unterdrückt («${mail.subject}»)`)
    return
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    // Lokale Entwicklung: Link in der Konsole ausgeben statt senden
    console.log(`[mail] RESEND_API_KEY fehlt – Mail an ${mail.to}:\n${mail.subject}\n${mail.text}`)
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || 'Mono <onboarding@resend.dev>',
      to: mail.to,
      subject: mail.subject,
      text: mail.text
    })
  })

  if (!res.ok) {
    console.error('[mail] Versand fehlgeschlagen:', res.status, await res.text())
    throw new Error('E-Mail konnte nicht gesendet werden')
  }
}
