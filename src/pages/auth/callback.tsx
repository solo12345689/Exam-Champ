import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@/util/supabase/component'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createClient()
  const { createUser } = useAuth();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          await createUser(session.user);
          router.push('/dashboard');
        } catch (error) {
          console.error('Error creating user:', error);
          // You might want to handle this error more gracefully
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router, createUser])

  return null
}