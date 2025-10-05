import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set content type to ensure client knows it's JSON
  res.setHeader('Content-Type', 'application/json');
  
  // Set headers to prevent caching of responses
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication and admin status
    const supabase = createClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if the user is an admin using Prisma
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isAdmin: true }
    });

    if (!dbUser?.isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const BUCKET_NAME = 'papers';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ 
        error: 'Server configuration error', 
        details: 'Missing required environment variables' 
      });
    }

    try {
      // First, check if the bucket exists using the REST API
      const listResponse = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!listResponse.ok) {
        const errorData = await listResponse.json();
        console.error('Error listing buckets:', errorData);
        return res.status(500).json({ 
          error: 'Failed to list storage buckets', 
          details: errorData.message || listResponse.statusText 
        });
      }
      
      const buckets = await listResponse.json();
      const bucketExists = buckets.some((bucket: any) => bucket.name === BUCKET_NAME);
      
      if (bucketExists) {
        // Bucket already exists, update its configuration
        const updateResponse = await fetch(`${supabaseUrl}/storage/v1/bucket/${BUCKET_NAME}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            public: true,
            file_size_limit: 50 * 1024 * 1024 // 50MB limit
          })
        });
        
        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          console.error('Error updating bucket:', errorData);
          return res.status(500).json({ 
            error: 'Failed to update bucket configuration', 
            details: errorData.message || updateResponse.statusText 
          });
        }
        
        return res.status(200).json({ 
          success: true, 
          message: 'Bucket configuration updated successfully',
          bucketName: BUCKET_NAME
        });
      } else {
        // Bucket doesn't exist, create it
        const createResponse = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: BUCKET_NAME,
            public: true,
            file_size_limit: 50 * 1024 * 1024 // 50MB limit
          })
        });
        
        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          console.error('Error creating bucket:', errorData);
          return res.status(500).json({ 
            error: 'Failed to create storage bucket', 
            details: errorData.message || createResponse.statusText 
          });
        }
        
        // Create a public policy for the bucket
        const policyResponse = await fetch(`${supabaseUrl}/storage/v1/bucket/${BUCKET_NAME}/policy`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'public-access',
            definition: {
              type: 'object',
              properties: {
                name: {
                  type: 'string'
                }
              }
            },
            allow: 'select'
          })
        });
        
        if (!policyResponse.ok) {
          console.warn('Warning: Could not create public policy for bucket:', await policyResponse.text());
          // Continue anyway, as the bucket was created successfully
        }
        
        return res.status(201).json({ 
          success: true, 
          message: 'Bucket created successfully',
          bucketName: BUCKET_NAME
        });
      }
    } catch (error) {
      console.error('Exception during bucket operation:', error);
      return res.status(500).json({ 
        error: 'Exception during bucket operation', 
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error in create-papers-bucket API:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}