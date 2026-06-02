import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
        }

        // 1. Verificar si el negocio existe
        const { data: business, error } = await supabase
            .from('businesses')
            .select('id, name, description')
            .ilike('email', email.trim())
            .limit(1)
            .maybeSingle();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!business) {
            // Seguridad: NO revelar si el correo existe o no a los atacantes
            return NextResponse.json({ success: true, message: 'Si el correo existe, enviaremos un PIN.' });
        }

        // 2. Generar PIN aleatorio de 6 digitos
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        const expiration = Date.now() + 15 * 60 * 1000; // 15 mins

        // 3. Extraer el bloque auth existente o crearlo
        let sysAuth = {};
        const sysAuthMatch = business.description?.match(/---SYS_AUTH---\n(.*)/);
        if (sysAuthMatch) {
            try {
                sysAuth = JSON.parse(sysAuthMatch[1].trim());
            } catch(e) {}
        } else {
            // Convertir la password vieja a nueva estructura si existe
            const pwdMatch = business.description?.match(/\[PWD:(.*?)\]/);
            const oldPwd = pwdMatch ? (pwdMatch[1] || "").trim() : null;
            if (oldPwd) sysAuth.pwd = oldPwd;
        }

        // Añadir PIN de recuperación
        sysAuth.recoveryPin = pin;
        sysAuth.recoveryExp = expiration;

        // Limpiar descripcion
        const cleanDesc = (business.description || "").replace(/\n*\[PWD:.*?\]/g, "").replace(/\n*---SYS_AUTH---\n.*/g, "").trim();
        const newDesc = `${cleanDesc}\n\n---SYS_AUTH---\n${JSON.stringify(sysAuth)}`;

        // Guardar PIN
        await supabase.from('businesses').update({ description: newDesc }).eq('id', business.id);

        // 4. Enviar correo via Resend
        if (process.env.RESEND_API_KEY) {
            await resend.emails.send({
                from: 'ResiDate <onboarding@resend.dev>',
                to: email.trim(),
                subject: `Tú código de acceso: ${pin}`,
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
        } else {
            console.log(`[DEV MODE] Correo simulado. PIN para ${email}: ${pin}`);
        }
        
        console.log(`[DEV MODE] PIN de recuperación para ${email}: ${pin}`);

        return NextResponse.json({ success: true, message: 'Si el correo existe, enviaremos un PIN.' });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
