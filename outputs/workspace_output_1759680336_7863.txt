import React from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/router';
import { ArrowRight } from 'lucide-react';

interface SubjectButtonProps {
  name: string;
  color?: string;
  hasSubcategories?: boolean;
  id: string;
}

const getSubjectColor = (name: string): string => {
  const colors: Record<string, string> = {
    'Science': 'from-green-600 to-green-800',
    'Maths': 'from-blue-600 to-blue-800',
    'English': 'from-purple-600 to-purple-800',
    'SST': 'from-red-600 to-red-800',
  };
  
  return colors[name] || 'from-indigo-600 to-indigo-800';
};

const SubjectButton: React.FC<SubjectButtonProps> = ({ 
  name, 
  color,
  hasSubcategories = false,
  id 
}) => {
  const router = useRouter();
  const gradientColor = getSubjectColor(name);

  const handleClick = () => {
    if (hasSubcategories) {
      router.push(`/subcategories/${id}`);
    } else {
      router.push(`/papers/${id}`);
    }
  };

  return (
    <button 
      onClick={handleClick}
      className={`w-full h-32 rounded-xl bg-gradient-to-br ${gradientColor} hover:shadow-lg transition-all duration-300 flex flex-col justify-between p-6 text-left`}
    >
      <div className="text-2xl font-bold text-white">{name}</div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-white/80">View papers</span>
        <ArrowRight className="h-5 w-5 text-white" />
      </div>
    </button>
  );
};

export default SubjectButton;