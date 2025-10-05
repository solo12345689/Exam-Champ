import React from 'react';
import { useRouter } from 'next/router';
import { ArrowRight, FileText } from 'lucide-react';

interface SubCategoryButtonProps {
  name: string;
  id: string;
  subjectId: string;
  color?: string;
}

const getSubCategoryColor = (name: string): string => {
  const colors: Record<string, string> = {
    // SST subcategories
    'History': 'from-amber-600 to-amber-800',
    'Geography': 'from-emerald-600 to-emerald-800',
    'Civics': 'from-blue-600 to-blue-800',
    'Economics': 'from-purple-600 to-purple-800',
    // English subcategories
    'First Flight': 'from-pink-600 to-pink-800',
    'Footprints': 'from-indigo-600 to-indigo-800',
  };
  
  return colors[name] || 'from-gray-600 to-gray-800';
};

const SubCategoryButton: React.FC<SubCategoryButtonProps> = ({ 
  name, 
  id,
  subjectId,
  color
}) => {
  const router = useRouter();
  const gradientColor = getSubCategoryColor(name);

  const handleClick = () => {
    router.push(`/papers/${subjectId}/${id}`);
  };

  return (
    <button 
      onClick={handleClick}
      className={`w-full h-28 rounded-lg bg-gradient-to-br ${gradientColor} hover:shadow-xl hover:scale-105 transition-all duration-300 flex flex-col justify-between p-6 text-left relative overflow-hidden group`}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-6 w-6 text-white" />
          <div className="text-xl font-semibold text-white">{name}</div>
        </div>
      </div>
      
      <div className="relative z-10 flex justify-between items-center">
        <span className="text-sm text-white/90 font-medium">View papers</span>
        <ArrowRight className="h-5 w-5 text-white group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
};

export default SubCategoryButton;