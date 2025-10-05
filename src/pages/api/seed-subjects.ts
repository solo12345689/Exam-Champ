import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create subjects
    const sst = await prisma.subject.create({
      data: {
        name: 'SST',
        hasSubcategories: true,
      },
    });

    const english = await prisma.subject.create({
      data: {
        name: 'English',
        hasSubcategories: true,
      },
    });

    const science = await prisma.subject.create({
      data: {
        name: 'Science',
        hasSubcategories: false,
      },
    });

    const maths = await prisma.subject.create({
      data: {
        name: 'Maths',
        hasSubcategories: false,
      },
    });

    // Create subcategories for SST
    const sstSubcategories = await prisma.subCategory.createMany({
      data: [
        { name: 'History', subjectId: sst.id },
        { name: 'Geography', subjectId: sst.id },
        { name: 'Civics', subjectId: sst.id },
        { name: 'Economics', subjectId: sst.id },
      ],
    });

    // Create subcategories for English
    const englishSubcategories = await prisma.subCategory.createMany({
      data: [
        { name: 'First Flight', subjectId: english.id },
        { name: 'Footprints', subjectId: english.id },
      ],
    });

    return res.status(200).json({
      success: true,
      message: 'Subjects and subcategories created successfully',
    });
  } catch (error) {
    console.error('Error seeding subjects:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}