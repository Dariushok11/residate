import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin client that bypasses RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { email, pin, newPassword } = await req.json();

        if (!email || !pin || !newPassword) {
            return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
        }

        // 1. Buscar negocio con cliente admin (sin restricciones de RLS)
        const { data: business, error } = await supabaseAdmin
            .from('businesses')
            .select('id, description')
            .ilike('email', email.trim())
            .limit(1)
            .maybeSingle();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!business) {
            return NextResponse.json({ error: 'PIN inválido o caducado.' }, { status: 400 });
        }

        // 2. Validar PIN
        let sysAuth: any = {};
        const sysAuthMatch = business.description?.match(/---SYS_AUTH---\n(.*)/);
        if (sysAuthMatch) {
            try { sysAuth = JSON.parse(sysAuthMatch[1].trim()); } catch(e) {}
        }

        if (!sysAuth.recoveryPin || sysAuth.recoveryPin !== pin.trim()) {
            return NextResponse.json({ error: 'PIN inválido o caducado.' }, { status: 400 });
        }

        if (!sysAuth.recoveryExp || Date.now() > sysAuth.recoveryExp) {
            return NextResponse.json({ error: 'El PIN ha caducado. Solicita uno nuevo.' }, { status: 400 });
        }

        // 3. Actualizar contraseña y eliminar PIN de recuperación
        sysAuth.pwd = newPassword.trim();
        delete sysAuth.recoveryPin;
        delete sysAuth.recoveryExp;

        const cleanDesc = (business.description || '').replace(/\n*---SYS_AUTH---\n.*/g, '').trim();
        const newDesc = `${cleanDesc}\n\n---SYS_AUTH---\n${JSON.stringify(sysAuth)}`;

        const { error: updateError } = await supabaseAdmin
            .from('businesses')
            .update({ description: newDesc })
            .eq('id', business.id);

        if (updateError) {
            return NextResponse.json({ error: 'Error al actualizar la contraseña.' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
