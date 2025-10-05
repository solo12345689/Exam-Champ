import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Calendar } from 'lucide-react';

interface PaperCardProps {
  year: number;
  fileUrl: string;
  topic?: string;
  onViewPaper: (fileUrl: string) => void;
}

const PaperCard: React.FC<PaperCardProps> = ({ year, fileUrl, topic, onViewPaper }) => {
  const openPdf = () => {
    onViewPaper(fileUrl);
  };

  return (
    <Card className="w-full hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-yellow-400" />
            <span className="text-2xl font-bold">{year}</span>
          </div>
          <FileText className="h-6 w-6 text-yellow-400" />
        </CardTitle>
        {topic && (
          <p className="text-sm text-gray-400 mt-2">{topic}</p>
        )}
      </CardHeader>
      <CardContent>
        <Button 
          onClick={openPdf} 
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold flex items-center justify-center gap-2"
        >
          <Eye className="h-4 w-4" />
          View Paper
        </Button>
      </CardContent>
    </Card>
  );
};

export default PaperCard;