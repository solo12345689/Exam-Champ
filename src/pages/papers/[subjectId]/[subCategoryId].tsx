import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import PaperCard from '@/components/PaperCard';
import DynamicPdfViewer from '@/components/DynamicPdfViewer';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface Paper {
  id: string;
  year: number;
  fileUrl: string;
}

interface Subject {
  id: string;
  name: string;
}

interface SubCategory {
  id: string;
  name: string;
  subjectId: string;
}

export default function SubCategoryPapersPage() {
  const router = useRouter();
  const { subjectId, subCategoryId } = router.query;
  const [papers, setPapers] = useState<Paper[]>([]);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [subCategory, setSubCategory] = useState<SubCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPaper, setSelectedPaper] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!subjectId || !subCategoryId) return;

      try {
        // Fetch subject details
        const subjectResponse = await fetch(`/api/subjects`);
        const subjects = await subjectResponse.json();
        const currentSubject = subjects.find((s: Subject) => s.id === subjectId);
        setSubject(currentSubject || null);

        // Fetch subcategory details
        const subCategoriesResponse = await fetch(`/api/subcategories?subjectId=${subjectId}`);
        const subCategories = await subCategoriesResponse.json();
        const currentSubCategory = subCategories.find((sc: SubCategory) => sc.id === subCategoryId);
        setSubCategory(currentSubCategory || null);

        // Fetch papers
        const papersResponse = await fetch(`/api/papers?subjectId=${subjectId}&subCategoryId=${subCategoryId}`);
        const data = await papersResponse.json();
        setPapers(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [subjectId, subCategoryId]);

  const goBack = () => {
    router.push(`/subcategories/${subjectId}`);
  };

  const openPdf = (fileUrl: string) => {
    setSelectedPaper(fileUrl);
  };

  const closePdf = () => {
    setSelectedPaper(null);
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
        Back to {subject?.name} Categories
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">
            {subject?.name}: {subCategory?.name} Papers
          </CardTitle>
        </CardHeader>
      </Card>

      {papers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg">No papers available for this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {papers.map((paper) => (
            <div key={paper.id}>
              <PaperCard 
                year={paper.year} 
                fileUrl={paper.fileUrl} 
                onViewPaper={openPdf}
              />
            </div>
          ))}
        </div>
      )}

      {selectedPaper && (
        <DynamicPdfViewer fileUrl={selectedPaper} onClose={closePdf} />
      )}
    </div>
  );
}