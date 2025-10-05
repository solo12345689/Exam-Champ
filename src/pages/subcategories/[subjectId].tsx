import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import SubCategoryButton from '@/components/SubCategoryButton';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface SubCategory {
  id: string;
  name: string;
  subjectId: string;
}

interface Subject {
  id: string;
  name: string;
}

export default function SubCategoriesPage() {
  const router = useRouter();
  const { subjectId } = router.query;
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!subjectId) return;

      try {
        // Fetch subject details
        const subjectResponse = await fetch(`/api/subjects`);
        const subjects = await subjectResponse.json();
        const currentSubject = subjects.find((s: Subject) => s.id === subjectId);
        setSubject(currentSubject || null);

        // Fetch subcategories
        const subCategoriesResponse = await fetch(`/api/subcategories?subjectId=${subjectId}`);
        const data = await subCategoriesResponse.json();
        setSubCategories(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [subjectId]);

  const goBack = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 py-8">
        <div className="container mx-auto px-4">
          <Button 
            variant="ghost" 
            className="mb-4 flex items-center gap-2 text-white hover:text-yellow-400"
            onClick={goBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Subjects
          </Button>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">
              {subject?.name} <span className="text-yellow-400">Categories</span>
            </h1>
            <p className="text-gray-300">Select a category to view exam papers</p>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {subCategories.map((subCategory) => (
            <SubCategoryButton
              key={subCategory.id}
              id={subCategory.id}
              name={subCategory.name}
              subjectId={subCategory.subjectId}
            />
          ))}
        </div>

        {subCategories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No categories available for this subject yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}