import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StatusSnapshot {
  user_id: string;
  status: string;
  timestamp: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Status snapshot job started at:', new Date().toISOString());

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Fetch all active profiles with their current status
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, status')
      .not('status', 'is', null);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} profiles to snapshot`);

    // Get the last status change for each user to avoid duplicate entries
    const snapshots: StatusSnapshot[] = [];
    
    for (const profile of profiles || []) {
      // Check the last status change for this user
      const { data: lastChange, error: lastChangeError } = await supabase
        .from('status_changes')
        .select('new_status, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastChangeError) {
        console.error(`Error fetching last change for user ${profile.id}:`, lastChangeError);
        continue;
      }

      // Only create a snapshot if:
      // 1. There's no previous status change, OR
      // 2. The current status is different from the last recorded status, OR
      // 3. The last change was more than 1 hour ago (to track long-running statuses)
      const shouldSnapshot = !lastChange || 
        lastChange.new_status !== profile.status ||
        (new Date().getTime() - new Date(lastChange.created_at).getTime()) > 3600000;

      if (shouldSnapshot && profile.status) {
        snapshots.push({
          user_id: profile.id,
          status: profile.status,
          timestamp: new Date().toISOString(),
        });
      }
    }

    console.log(`Creating ${snapshots.length} status snapshots`);

    // Insert snapshots as status changes (using the system as the changed_by)
    if (snapshots.length > 0) {
      const statusChanges = snapshots.map(snapshot => ({
        user_id: snapshot.user_id,
        old_status: null,
        new_status: snapshot.status,
        changed_by: snapshot.user_id, // Self-recorded by the system
        reason: 'Snapshot automático do sistema',
      }));

      const { error: insertError } = await supabase
        .from('status_changes')
        .insert(statusChanges);

      if (insertError) {
        console.error('Error inserting status changes:', insertError);
        throw insertError;
      }

      console.log(`Successfully created ${snapshots.length} status snapshots`);
    } else {
      console.log('No snapshots needed - all statuses are up to date');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${profiles?.length || 0} profiles, created ${snapshots.length} snapshots`,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in status snapshot job:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
