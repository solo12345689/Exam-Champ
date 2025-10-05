import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers to allow requests from any origin in preview environment
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user email matches admin email from env var as a fallback
    const isAdminByEmail = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    
    try {
      // Try to get admin status from database
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { isAdmin: true }
      });
      
      return res.status(200).json({ 
        isAdmin: dbUser?.isAdmin || isAdminByEmail || false,
        source: dbUser?.isAdmin ? 'database' : (isAdminByEmail ? 'email_match' : 'none')
      });
    } catch (dbError) {
      console.error('Database error checking admin status:', dbError);
      // Fall back to email check if database query fails
      return res.status(200).json({ 
        isAdmin: isAdminByEmail || false,
        source: 'email_match_fallback'
      });
    }
  } catch (error) {
    console.error('Error checking admin status:', error);
    // Return a more informative error response
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    });
  }
}