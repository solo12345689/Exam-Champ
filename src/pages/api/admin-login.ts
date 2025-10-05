import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Admin login API called');
  
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the admin credentials from environment variables
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('Admin credentials not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    // Get the user-provided credentials from the request body
    const { email, password } = req.body;
    
    // Validate that credentials were provided
    if (!email || !password) {
      console.error('Missing credentials in request');
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Verify that the provided email matches the admin email
    if (email !== adminEmail) {
      console.error('Invalid admin email provided');
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const supabase = createClient(req, res);
    
    // Try to sign in with the user-provided credentials
    console.log('Attempting to sign in admin user');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    console.log('Sign in response:', signInData && signInData.user ? 'Success' : 'Failed');
    if (signInError) {
      console.log('Sign in error:', signInError.message);
      
      // If the user doesn't exist, try to create it first
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('Admin user not found, attempting to create');
        
        // Try to sign up the admin user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: adminEmail,
          password: adminPassword,
          options: {
            emailRedirectTo: `${req.headers.origin}/dashboard`,
          },
        });

        if (signUpError) {
          console.error('Error signing up admin user:', signUpError);
          return res.status(500).json({ error: signUpError.message });
        }

        // Try signing in again
        const { data: retrySignInData, error: retrySignInError } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: adminPassword,
        });

        if (retrySignInError) {
          console.error('Error signing in after signup:', retrySignInError);
          return res.status(500).json({ error: retrySignInError.message });
        }

        // Create the user in the database with isAdmin flag
        if (retrySignInData.user) {
          await prisma.user.upsert({
            where: { id: retrySignInData.user.id },
            update: { isAdmin: true },
            create: {
              id: retrySignInData.user.id,
              email: retrySignInData.user.email || '',
              isAdmin: true,
            },
          });

          return res.status(200).json({ 
            message: 'Admin user created and authenticated successfully',
            session: retrySignInData.session
          });
        }
      } else {
        return res.status(401).json({ error: signInError.message });
      }
    }

    // If sign-in was successful, ensure the user has admin privileges
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

      return res.status(200).json({ 
        message: 'Admin user authenticated successfully',
        session: signInData.session
      });
    }

    return res.status(500).json({ error: 'Failed to authenticate admin user' });
  } catch (error) {
    console.error('Error in admin-login API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}