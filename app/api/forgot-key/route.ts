import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';

// Use environment variable if available, fallback to the provided test key
const resend = new Resend(process.env.RESEND_API_KEY || 're_baXTqWN5_7xUAQH7wGZH92ayEhB73Hj8o');

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
        }

        // Fetch user from Supabase to grab their real key
        const { data: business, error: dbError } = await supabase
            .from('businesses')
            .select('description')
            .eq('email', email)
            .single();

        if (dbError || !business) {
            return new Response(JSON.stringify({ error: 'No user found' }), { status: 404 });
        }

        // Extract password from description workaround
        const pwdMatch = business.description?.match(/\[PWD:(.*?)\]/);
        const storedPassword = pwdMatch ? pwdMatch[1] : '12345'; // Default fallback

        // Send email with their real password
        // Important: use @residate.com which is verified, so Resend can deliver to ANY email address.
        const resendData = await resend.emails.send({
            from: 'ResiDate <soporte@residate.com>',
            to: [email],
            subject: 'Recuperación de Llave Secreta - ResiDate',
            html: `
                <div style="font-family: serif; color: #001f3f; padding: 20px;">
                    <h1 style="color: #c5a059;">ResiDate</h1>
                    <p>Hola,</p>
                    <p>Has solicitado recuperar tu llave de acceso para el Portal del Socio de <strong>ResiDate</strong>.</p>
                    <p>Aqui tienes tu Llave Secreta:</p>
                    <p><span style="background: #f4f1ea; padding: 10px 15px; border-radius: 4px; font-weight: bold; font-size: 18px; color: #001f3f;">${storedPassword}</span></p>
                    <p>Por favor, utiliza esta llave junto con tu correo electrónico para iniciar sesión de forma segura.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0 20px 0;" />
                    <p style="font-size: 12px; color: #666;">© 2026 ResiDate - Timeless Experiences</p>
                </div>
            `,
        });

        if (resendData.error) {
            console.error('Resend encountered an error:', resendData.error);
            // If they haven't verified residate.com, this will let the client know.
            return new Response(JSON.stringify({ error: resendData.error.message }), { status: 400 });
        }

        return new Response(JSON.stringify(resendData), { status: 200 });
    } catch (error: any) {
        console.error('Server error during forgot-key:', error);
        return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
    }
}
