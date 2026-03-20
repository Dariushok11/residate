import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
    const businessId = "test-delete-" + Date.now();

    // Insert a dummy business
    const { error: insertError } = await supabase.from('businesses').insert({
        id: businessId,
        name: 'Delete Test',
        email: `test${Date.now()}@example.com`,
        description: 'test',
        category: 'test',
        location: 'test'
    });

    if (insertError) {
        console.error("Failed to insert dummy business, testing is blocked:", insertError.message);
        return;
    }

    // Try to delete it
    const { error: deleteError } = await supabase.from('businesses').delete().eq('id', businessId);

    if (deleteError) {
        console.error("Failed to delete business, RLS blocks it:", deleteError.message);
    } else {
        console.log("Success! Anon key CAN delete businesses.");
    }
}

checkRLS();
