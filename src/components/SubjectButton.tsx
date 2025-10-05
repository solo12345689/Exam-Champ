import React from 'react';
import { useRouter } from 'next/router';
import { ArrowRight, BookOpen, Calculator, Globe, Languages } from 'lucide-react';

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

const getSubjectIcon = (name: string) => {
  const icons: Record<string, React.ReactNode> = {
    'Science': <BookOpen className="h-8 w-8 text-white" />,
    'Maths': <Calculator className="h-8 w-8 text-white" />,
    'English': <Languages className="h-8 w-8 text-white" />,
    'SST': <Globe className="h-8 w-8 text-white" />,
  };
  
  return icons[name] || <BookOpen className="h-8 w-8 text-white" />;
};

const getSubjectDescription = (name: string): string => {
  const descriptions: Record<string, string> = {
    'Science': 'Physics, Chemistry, Biology',
    'Maths': 'Algebra, Geometry, Statistics',
    'English': 'First Flight, Footprints',
    'SST': 'History, Geography, Civics, Economics',
  };
  
  return descriptions[name] || 'View papers';
};

const SubjectButton: React.FC<SubjectButtonProps> = ({ 
  name, 
  color,
  hasSubcategories = false,
  id 
}) => {
  const router = useRouter();
  const gradientColor = getSubjectColor(name);
  const icon = getSubjectIcon(name);
  const description = getSubjectDescription(name);

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
      className={`w-full h-40 rounded-xl bg-gradient-to-br ${gradientColor} hover:shadow-2xl hover:scale-105 transition-all duration-300 flex flex-col justify-between p-6 text-left relative overflow-hidden group`}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          {icon}
          <div className="text-2xl font-bold text-white">{name}</div>
        </div>
        <p className="text-sm text-white/80">{description}</p>
      </div>
      
      <div className="relative z-10 flex justify-between items-center">
        <span className="text-sm text-white/90 font-medium">
          {hasSubcategories ? 'Choose category' : 'View papers'}
        </span>
        <ArrowRight className="h-5 w-5 text-white group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
};

export default SubjectButton;