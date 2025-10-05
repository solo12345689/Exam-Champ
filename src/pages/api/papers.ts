import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subjectId, subCategoryId } = req.query;

  if (!subjectId || typeof subjectId !== 'string') {
    return res.status(400).json({ error: 'Subject ID is required' });
  }

  try {
    const papers = await prisma.paper.findMany({
      where: {
        subjectId,
        ...(subCategoryId && typeof subCategoryId === 'string' 
          ? { subCategoryId } 
          : {})
      },
      orderBy: { year: 'desc' }
    });
    
    return res.status(200).json(papers);
  } catch (error) {
    console.error('Error fetching papers:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}