import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data, error } = await supabase.from('businesses').select('email, description, name');
    console.log("Registered businesses:");
    for (const b of data) {
        const pwdMatch = b.description?.match(/\[PWD:(.*?)\]/);
        const storedPassword = pwdMatch ? pwdMatch[1] : null;
        console.log(`- ${b.name} (${b.email}): RAW_DESC_LENGTH: ${b.description?.length} | PWD = ${storedPassword}`);
    }
}
main();
