import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * This page handles the OAuth redirect from Supabase (Google / GitHub login).
 * Supabase exchanges the code for a session automatically, then we redirect
 * the user to their appropriate dashboard based on their role.
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // Give Supabase a moment to process the session from the URL fragment
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('OAuth callback error:', error);
        navigate('/login');
        return;
      }

      if (!session?.user) {
        navigate('/login');
        return;
      }

      const supabaseUser = session.user;

      // Check if a profile already exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (!profile) {
        // New social-login user — create a default profile
        const meta = supabaseUser.user_metadata || {};
        const newProfile = {
          id: supabaseUser.id,
          name: meta.full_name || meta.name || supabaseUser.email || 'User',
          email: supabaseUser.email || '',
          role: 'student',
          department: 'General',
          idNumber: 'SOCIAL-' + supabaseUser.id.substring(0, 5),
          createdAt: new Date().toISOString(),
          eco_stats: {
            total_pages_saved: 0,
            total_water_saved: 0,
            total_co2_prevented: 0,
          }
        };
        await supabase.from('profiles').upsert(newProfile);
        navigate('/student');
      } else {
        // Existing user — navigate based on role
        if (profile.role === 'admin') navigate('/admin');
        else if (profile.role === 'faculty' || profile.role === 'hod') navigate('/faculty');
        else navigate('/student');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAF9]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 font-medium">Completing sign in...</p>
      </div>
    </div>
  );
}
