require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testBucket() {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error("Error fetching buckets:", error);
        return;
    }
    console.log("Buckets:", data.map(b => b.name));

    if (!data.find(b => b.name === 'm1g-assets')) {
        console.log("Creating m1g-assets bucket...");
        const { data: createData, error: createError } = await supabase.storage.createBucket('m1g-assets', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'application/pdf', 'video/mp4'],
            fileSizeLimit: 10485760 // 10 MB
        });
        if (createError) {
            console.error("Error creating bucket:", createError);
        } else {
            console.log("Created bucket:", createData);
        }
    } else {
        console.log("m1g-assets bucket already exists.");
    }
}

testBucket();
