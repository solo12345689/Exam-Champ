import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';
import prisma from '@/lib/prisma';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
    // Set maximum payload size to match our 50MB file size limit
    responseLimit: '60mb', // Slightly larger than 50MB to account for form data overhead
  },
};

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

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isAdmin: true }
    });

    if (!dbUser?.isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    // Parse form data with appropriate file size limits
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB - match Supabase storage limit
      maxFieldsSize: 10 * 1024 * 1024, // 10MB for form fields
      multiples: true
    });
    
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Error parsing form data:', err);
          reject(err);
        } else {
          resolve([fields, files]);
        }
      });
    });

    const file = files.file?.[0];
    const subjectId = fields.subjectId?.[0];
    const subCategoryId = fields.subCategoryId?.[0];
    const year = fields.year?.[0];
    const topic = fields.topic?.[0];

    if (!file || !subjectId || !year) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Check if subcategory exists if provided
    if (subCategoryId) {
      const subCategory = await prisma.subCategory.findUnique({
        where: { id: subCategoryId },
      });

      if (!subCategory) {
        return res.status(404).json({ error: 'Subcategory not found' });
      }
    }

    // Upload file to Supabase Storage using direct REST API with service role key
    const fileBuffer = fs.readFileSync(file.filepath);
    const fileName = `${Date.now()}_${file.originalFilename?.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    console.log('Uploading file to Supabase Storage:', {
      fileName,
      fileSize: fileBuffer.length,
      mimeType: file.mimetype,
      originalName: file.originalFilename
    });
    
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
      // First check if the bucket exists using the REST API
      const listResponse = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!listResponse.ok) {
        console.error('Error listing buckets:', await listResponse.text());
        // Continue anyway - we'll try to upload and see if the bucket exists
      } else {
        const buckets = await listResponse.json();
        const bucketExists = buckets.some((bucket: any) => bucket.name === BUCKET_NAME);
        console.log(`Bucket '${BUCKET_NAME}' exists: ${bucketExists ? 'Yes' : 'No'}`);
        
        // If bucket doesn't exist, create it
        if (!bucketExists) {
          console.log(`Bucket '${BUCKET_NAME}' doesn't exist, creating it...`);
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
            console.error('Error creating bucket:', await createResponse.text());
            return res.status(500).json({ 
              error: 'Failed to create storage bucket', 
              details: 'Could not create storage bucket. Please try initializing storage first.' 
            });
          }
          console.log(`Bucket '${BUCKET_NAME}' created successfully`);
        }
      }
      
      // Log the attempt to upload
      console.log(`Attempting to upload file to bucket '${BUCKET_NAME}'`);
      
      // Upload file to the bucket with retry logic
      let uploadAttempt = 0;
      let uploadSuccess = false;
      let uploadError: Error | null = null;
      
      while (uploadAttempt < 3 && !uploadSuccess) {
        uploadAttempt++;
        console.log(`Upload attempt ${uploadAttempt} for file ${fileName}`);
        
        try {
          // Use fetch to upload the file directly
          const uploadResponse = await fetch(
            `${supabaseUrl}/storage/v1/object/${BUCKET_NAME}/${fileName}`, 
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': file.mimetype || 'application/pdf',
                'Cache-Control': '3600',
                'x-upsert': uploadAttempt > 1 ? 'true' : 'false' // Try to overwrite on retry attempts
              },
              body: fileBuffer
            }
          );
          
          if (uploadResponse.ok) {
            console.log(`Upload succeeded on attempt ${uploadAttempt}`);
            uploadSuccess = true;
          } else {
            const errorText = await uploadResponse.text();
            console.error(`Upload attempt ${uploadAttempt} failed:`, errorText);
            uploadError = new Error(errorText || 'Upload failed');
            
            // If this is not the last attempt, wait before retrying
            if (uploadAttempt < 3) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
            }
          }
        } catch (e) {
          console.error(`Exception during upload attempt ${uploadAttempt}:`, e);
          uploadError = e instanceof Error ? e : new Error('Unknown upload error');
          
          // If this is not the last attempt, wait before retrying
          if (uploadAttempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          }
        }
      }

      if (!uploadSuccess) {
        console.error('All upload attempts failed:', uploadError);
        return res.status(500).json({ 
          error: 'Failed to upload file to storage', 
          details: uploadError ? uploadError.message : 'Unknown upload error'
        });
      }
      
      console.log('File uploaded successfully');
    } catch (uploadException) {
      console.error('Exception during file upload:', uploadException);
      return res.status(500).json({ 
        error: 'Exception during file upload', 
        details: uploadException instanceof Error ? uploadException.message : 'Unknown error'
      });
    }

    // Generate the public URL for the uploaded file
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${fileName}`;
    console.log('Generated public URL:', publicUrl);

    // Create paper record in database
    let paper;
    try {
      paper = await prisma.paper.create({
        data: {
          year: parseInt(year),
          topic: topic || null,
          fileUrl: publicUrl,
          subjectId,
          subCategoryId: subCategoryId || null,
          userId: user.id,
        },
      });
      console.log('Paper record created in database:', paper.id);
    } catch (dbError) {
      console.error('Error creating paper record in database:', dbError);
      return res.status(500).json({
        error: 'Failed to create paper record in database',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error',
        fileUrl: publicUrl // Return the URL so the file isn't lost
      });
    }

    return res.status(200).json({ success: true, paper });
  } catch (error) {
    console.error('Error uploading paper:', error);
    
    // Ensure we're returning a proper JSON response with error details
    try {
      // Check if headers have already been sent
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
        
        // Create a more detailed error message
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const errorStack = error instanceof Error ? error.stack : '';
        
        console.error('Detailed error information:', {
          message: errorMessage,
          stack: errorStack
        });
        
        return res.status(500).json({ 
          error: 'Internal server error',
          details: errorMessage
        });
      } else {
        console.error('Headers already sent, cannot send error response');
      }
    } catch (responseError) {
      // Last resort if JSON serialization fails
      console.error('Error sending JSON response:', responseError);
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
        res.status(500).end(JSON.stringify({ 
          error: 'Internal server error', 
          details: 'Failed to process request'
        }));
      }
    }
  }
}