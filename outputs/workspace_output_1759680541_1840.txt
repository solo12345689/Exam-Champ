import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileIcon } from 'lucide-react';

interface PaperCardProps {
  year: number;
  fileUrl: string;
  onViewPaper: (fileUrl: string) => void;
}

const PaperCard: React.FC<PaperCardProps> = ({ year, fileUrl, onViewPaper }) => {
  const openPdf = () => {
    onViewPaper(fileUrl);
  };

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Year {year}</span>
          <FileIcon className="h-5 w-5" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={openPdf} 
          className="w-full"
          variant="outline"
        >
          View Paper
        </Button>
      </CardContent>
    </Card>
  );
};

export default PaperCard;