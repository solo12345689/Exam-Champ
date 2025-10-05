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
  topic?: string;
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
        // Sort papers by year in descending order (newest first)
        const sortedPapers = data.sort((a: Paper, b: Paper) => b.year - a.year);
        setPapers(sortedPapers);
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
      <div className="min-h-screen bg-gray-900 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
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
            Back to {subject?.name} Categories
          </Button>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">
              {subject?.name}: <span className="text-yellow-400">{subCategory?.name}</span>
            </h1>
            <p className="text-gray-300">Papers sorted by year - Select to view with zoom</p>
          </div>
        </div>
      </div>

      {/* Papers Grid */}
      <div className="container mx-auto px-4 py-12">
        {papers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No papers available for this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {papers.map((paper) => (
              <PaperCard 
                key={paper.id}
                year={paper.year} 
                fileUrl={paper.fileUrl}
                topic={paper.topic}
                onViewPaper={openPdf}
              />
            ))}
          </div>
        )}
      </div>

      {selectedPaper && (
        <DynamicPdfViewer fileUrl={selectedPaper} onClose={closePdf} />
      )}
    </div>
  );
}