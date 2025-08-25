const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };
    
    // Handle preflight request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }
    
    try {
        // Parse request body
        const { username, rank } = JSON.parse(event.body);
        
        if (!username || !rank) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Username and rank are required' })
            };
        }
        
        // Inisialisasi Supabase
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
        
        if (!supabaseUrl || !supabaseServiceKey) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Supabase credentials not configured' })
            };
        }
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Update data di tabel player_ranks
        const { data, error } = await supabase
            .from('player_ranks')
            .update({ 
                rank: rank,
                last_update: new Date().toISOString()
            })
            .eq('username', username);
        
        if (error) {
            throw error;
        }
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, data })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, error: error.message })
        };
    }
};