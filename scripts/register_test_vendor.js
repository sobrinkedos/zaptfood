const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function registerVendor() {
    const phone = '205346815639599'; // O número que apareceu no seu erro
    const name = 'ZaptFood Teste';

    console.log(`Registering vendor ${name} (${phone})...`);

    // 1. Check if exists
    const { data: existing } = await supabase
        .from('vendors')
        .select('*')
        .eq('phone', phone)
        .single();

    if (existing) {
        console.log('Vendor already exists. Updating status to approved...');
        const { error } = await supabase
            .from('vendors')
            .update({ status: 'approved' })
            .eq('id', existing.id);

        if (error) console.error('Error updating:', error);
        else console.log('Vendor updated successfully!');

    } else {
        console.log('Creating new vendor...');
        const { error } = await supabase
            .from('vendors')
            .insert([{
                name,
                phone,
                status: 'approved',
                has_own_delivery: false
            }]);

        if (error) console.error('Error creating:', error);
        else console.log('Vendor created successfully!');
    }
}

registerVendor();
