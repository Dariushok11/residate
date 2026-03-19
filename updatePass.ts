import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data: businesses, error } = await supabase.from('businesses').select('*');

    if (error) {
        console.error("Error fetching:", error);
        return;
    }

    let updatedCount = 0;

    for (const b of businesses) {
        if (!b.description || !b.description.includes('[PWD:')) {
            const defaultPassword = "12345";
            const newDesc = (b.description || "") + `\n\n[PWD:${defaultPassword}]`;
            const { error: updateError } = await supabase
                .from('businesses')
                .update({ description: newDesc })
                .eq('id', b.id);

            if (updateError) {
                console.error(`Error updating ${b.id}:`, updateError);
            } else {
                console.log(`Updated ${b.name} (${b.email}) with default password ${defaultPassword}`);
                updatedCount++;
            }
        }
    }

    console.log(`Updated ${updatedCount} businesses.`);
}

main();
