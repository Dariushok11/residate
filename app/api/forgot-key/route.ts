import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Admin client that bypasses RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
        }

        // 1. Verificar si el negocio existe (usamos el cliente admin para leer sin restricciones)
        const { data: business, error } = await supabaseAdmin
            .from('businesses')
            .select('id, name, description')
            .ilike('email', email.trim())
            .limit(1)
            .maybeSingle();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!business) {
            // Seguridad: NO revelar si el correo existe o no
            return NextResponse.json({ success: true });
        }

        // 2. Generar PIN aleatorio de 6 dígitos
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        const expiration = Date.now() + 15 * 60 * 1000; // 15 mins

        // 3. Extraer el bloque auth existente o crearlo
        let sysAuth: any = {};
        const sysAuthMatch = business.description?.match(/---SYS_AUTH---\n(.*)/);
        if (sysAuthMatch) {
            try {
                sysAuth = JSON.parse(sysAuthMatch[1].trim());
            } catch(e) {}
        } else {
            // Migrar password vieja si existe
            const pwdMatch = business.description?.match(/\[PWD:(.*?)\]/);
            const oldPwd = pwdMatch ? (pwdMatch[1] || '').trim() : null;
            if (oldPwd) sysAuth.pwd = oldPwd;
        }

        // Añadir PIN de recuperación
        sysAuth.recoveryPin = pin;
        sysAuth.recoveryExp = expiration;

        // Limpiar descripción y guardar
        const cleanDesc = (business.description || '').replace(/\n*\[PWD:.*?\]/g, '').replace(/\n*---SYS_AUTH---\n.*/g, '').trim();
        const newDesc = `${cleanDesc}\n\n---SYS_AUTH---\n${JSON.stringify(sysAuth)}`;

        // Guardar PIN con cliente admin (bypasa RLS)
        const { error: updateError } = await supabaseAdmin
            .from('businesses')
            .update({ description: newDesc })
            .eq('id', business.id);

        if (updateError) {
            console.error('Error guardando PIN:', updateError);
            return NextResponse.json({ error: 'Error interno al guardar PIN' }, { status: 500 });
        }

        console.log(`[INFO] PIN generado para ${email}: ${pin}`);

        // 4. Enviar correo via Resend
        if (process.env.RESEND_API_KEY) {
            const emailResult = await resend.emails.send({
                from: 'ResiDate <onboarding@resend.dev>',
                to: email.trim(),
                subject: `Tu código de acceso: ${pin}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; text-align: center; color: #1a1a1a;">
                        <h1 style="color: #997A5E;">ResiDate</h1>
                        <p>Hola <strong>${business.name}</strong>,</p>
                        <p>Has solicitado recuperar tu acceso al Portal del Socio. Tu PIN de seguridad es:</p>
                        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">${pin}</div>
                        <p style="font-size: 12px; color: #666;">Este código caducará en 15 minutos.</p>
                        <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 30px 0;" />
                        <p style="font-size: 10px; color: #999;">Si no has solicitado este código, ignora este correo.</p>
                    </div>
                `
            });

            if (emailResult.error) {
                console.error('Error de Resend:', emailResult.error);
                // Devolvemos éxito con advertencia — el PIN fue guardado pero el correo falló
                return NextResponse.json({ 
                    success: true, 
                    emailError: emailResult.error.message 
                });
            }
        } else {
            console.log(`[DEV MODE] PIN para ${email}: ${pin}`);
        }

        return NextResponse.json({ success: true });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
