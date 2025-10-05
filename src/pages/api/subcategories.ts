import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subjectId } = req.query;

  if (!subjectId || typeof subjectId !== 'string') {
    return res.status(400).json({ error: 'Subject ID is required' });
  }

  try {
    const subcategories = await prisma.subCategory.findMany({
      where: { subjectId },
      orderBy: { name: 'asc' }
    });
    
    return res.status(200).json(subcategories);
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}