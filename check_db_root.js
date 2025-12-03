require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn() {
    console.log('Checking if password column is accessible...');

    const { data, error } = await supabase
        .from('vendors')
        .select('id, password')
        .limit(1);

    if (error) {
        console.error('Error selecting password column:', error.message);
        if (error.message.includes('Could not find the')) {
            console.log('\n!!! DIAGNOSIS: The Schema Cache is stale. !!!');
            console.log('Please go to Supabase Dashboard -> Settings -> API -> Schema Cache -> Reload.');
        }
    } else {
        console.log('Success! Password column is accessible.');
    }
}

checkColumn();
