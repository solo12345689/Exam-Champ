import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Create admin API called');
  
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Request body:', JSON.stringify(req.body));
    const { email, password } = req.body;
    
    // Validate that this is the admin email
    console.log('Admin email from env:', process.env.NEXT_PUBLIC_ADMIN_EMAIL);
    console.log('Email from request:', email);
    
    // Get admin email from environment variable
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    
    if (!adminEmail || email !== adminEmail) {
      console.log('Unauthorized: email mismatch');
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const supabase = createClient(req, res);
    
    // First try to sign up the user
    console.log('Attempting to sign up admin user');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${req.headers.origin}/dashboard`,
      },
    });

    console.log('Sign up response:', signUpData ? 'Success' : 'Failed');
    if (signUpError) {
      console.log('Sign up error:', signUpError.message);
    }

    // If there's an error but it's not because the user already exists, return the error
    if (signUpError && !signUpError.message.includes('already registered')) {
      console.error('Error signing up admin user:', signUpError);
      return res.status(500).json({ error: signUpError.message });
    }

    // Now try to sign in the user
    console.log('Attempting to sign in admin user');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('Sign in response:', signInData && signInData.user ? 'Success' : 'Failed');
    if (signInError) {
      console.log('Sign in error:', signInError.message);
      return res.status(500).json({ error: signInError.message });
    }

    // Create or update the user in the database with isAdmin flag
    if (signInData.user) {
      await prisma.user.upsert({
        where: { id: signInData.user.id },
        update: { isAdmin: true },
        create: {
          id: signInData.user.id,
          email: signInData.user.email || '',
          isAdmin: true,
        },
      });

      // Return the session data so the client can set it
      return res.status(200).json({ 
        message: 'Admin user authenticated successfully',
        session: signInData.session
      });
    }

    return res.status(500).json({ error: 'Failed to authenticate admin user' });
  } catch (error) {
    console.error('Error in create-admin API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}