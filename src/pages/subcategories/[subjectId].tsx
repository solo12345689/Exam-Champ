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
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        className="mb-4 flex items-center gap-1"
        onClick={goBack}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Subjects
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">{subject?.name} Categories</CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {subCategories.map((subCategory) => (
          <SubCategoryButton
            key={subCategory.id}
            id={subCategory.id}
            name={subCategory.name}
            subjectId={subCategory.subjectId}
          />
        ))}
      </div>
    </div>
  );
}