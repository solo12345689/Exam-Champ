import React from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/router';

interface SubCategoryButtonProps {
  name: string;
  color?: string;
  id: string;
  subjectId: string;
}

const SubCategoryButton: React.FC<SubCategoryButtonProps> = ({ 
  name, 
  color = 'bg-secondary', 
  id,
  subjectId
}) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/papers/${subjectId}/${id}`);
  };

  return (
    <Button 
      onClick={handleClick}
      className={`w-full h-24 text-lg font-semibold ${color} hover:opacity-90 transition-opacity`}
    >
      {name}
    </Button>
  );
};

export default SubCategoryButton;