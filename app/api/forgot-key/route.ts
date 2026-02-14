import { Resend } from 'resend';

const resend = new Resend('re_baXTqWN5_7xUAQH7wGZH92ayEhB73Hj8o');

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
        }

        const data = await resend.emails.send({
            from: 'ResiDate <onboarding@resend.dev>',
            to: [email],
            subject: 'Recuperación de Llave - ResiDate',
            html: `
                <div style="font-family: serif; color: #001f3f; padding: 20px;">
                    <h1 style="color: #c5a059;">ResiDate</h1>
                    <p>Hola,</p>
                    <p>Has solicitado recuperar tu llave de acceso para <strong>ResiDate</strong>.</p>
                    <p>Tu llave de recuperación es: <span style="background: #f4f1ea; padding: 5px 10px; border-radius: 4px; font-weight: bold;">secret-key-123</span></p>
                    <p>Por favor, cámbiala en los ajustes una vez hayas iniciado sesión por seguridad.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #666;">© 2026 ResiDate - Timeless Experiences</p>
                </div>
            `,
        });

        return new Response(JSON.stringify(data), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
