import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    const { data, error } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('name', 'Delete Test');

    if (error) {
        console.error("Error fetching test businesses:", error);
        return;
    }

    if (!data || data.length === 0) {
        console.log("No test businesses found. They might be cached locally.");
        return;
    }

    console.log(`Found ${data.length} test businesses. Deleting...`);

    for (const b of data) {
        // Delete bookings first just in case
        await supabase.from('bookings').delete().eq('business_id', b.id);

        const { error: delError } = await supabase
            .from('businesses')
            .delete()
            .eq('id', b.id);

        if (delError) {
            console.error(`Failed to delete ${b.id}:`, delError);
        } else {
            console.log(`Deleted ${b.id}`);
        }
    }
}

cleanup();
