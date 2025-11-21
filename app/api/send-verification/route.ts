import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, firstname, lastname } = await request.json();

    // Vérifier que Resend est configuré
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key_here') {
      console.warn('⚠️ Resend API key not configured. Skipping email verification.');
      return NextResponse.json({
        success: false,
        message: 'Email service not configured'
      }, { status: 200 });
    }

    // Envoyer l'email de vérification
    const { data, error } = await resend.emails.send({
      from: 'Mini Uber <onboarding@resend.dev>', // Changez avec votre domaine vérifié
      to: [email],
      subject: 'Bienvenue sur Mini Uber - Vérifiez votre email',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">🚗 Mini Uber</h1>
            </div>

            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin-top: 0;">Bienvenue ${firstname} ${lastname} !</h2>

              <p style="color: #4b5563; font-size: 16px;">
                Merci de vous être inscrit sur Mini Uber. Votre compte a été créé avec succès !
              </p>

              <div style="background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #4b5563;">
                  <strong>Email:</strong> ${email}
                </p>
              </div>

              <p style="color: #4b5563;">
                Vous pouvez maintenant vous connecter et commencer à utiliser nos services.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/login"
                   style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Se connecter
                </a>
              </div>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

              <p style="color: #9ca3af; font-size: 14px; text-align: center;">
                Cet email a été envoyé par Mini Uber. Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in send-verification:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send verification email'
    }, { status: 500 });
  }
}
