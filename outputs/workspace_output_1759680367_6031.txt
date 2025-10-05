import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SubjectButton from '@/components/SubjectButton';
import AdminUploadForm from '@/components/AdminUploadForm';
import GoogleButton from '@/components/GoogleButton';
import { Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Image from 'next/image';
import { useToast } from "@/components/ui/use-toast";

interface Subject {
  id: string;
  name: string;
  hasSubcategories: boolean;
}

export default function Home() {
  const { user, signIn } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch('/api/subjects');
        const data = await response.json();
        setSubjects(data);
      } catch (error) {
        console.error('Error fetching subjects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  const handleLogoClick = () => {
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);
    
    // Show admin login after 999 clicks
    if (newCount >= 999) {
      setShowAdminLogin(true);
      setLogoClickCount(0); // Reset counter
      toast({
        title: "Admin Login Activated",
        description: "You can now log in as an administrator.",
      });
    }
    // Removed the click counter message
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-b from-gray-900 to-gray-800 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="text-left">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Your <span className="text-yellow-400">Secret Weapon</span> for Class 10 Exams
                </h1>
                <p className="text-lg text-gray-300 mb-8">
                  Access high-quality practice papers for all subjects to ace your exams with confidence.
                </p>
                <Button 
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium px-6 py-3 rounded-lg"
                  onClick={() => {
                    const subjectsSection = document.getElementById('subjects-section');
                    if (subjectsSection) {
                      subjectsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  Get Started
                </Button>
              </div>
              <div className="relative h-64 md:h-96">
                <Image 
                  src="https://assets.co.dev/8d5d2ba8-7164-40ed-b92c-7f55eb47f131/download-148ce73.png"
                  alt="Students studying"
                  fill
                  style={{ objectFit: 'cover' }}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Subjects Section */}
        <div id="subjects-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-white mb-8">Choose Your Subject</h2>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
            </div>
          ) : subjects.length === 0 ? (
            <Card className="w-full max-w-md mx-auto bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">No Subjects Found</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-gray-300">It looks like the database needs to be initialized with subjects.</p>
                <Button 
                  onClick={async () => {
                    try {
                      await fetch('/api/seed-subjects', { method: 'POST' });
                      router.reload();
                    } catch (error) {
                      console.error('Error seeding subjects:', error);
                    }
                  }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  Initialize Subjects
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Use Set to ensure unique subject names */}
              {Array.from(new Set(subjects.map(s => s.name))).map(uniqueName => {
                const subject = subjects.find(s => s.name === uniqueName);
                if (!subject) return null;
                return (
                  <SubjectButton
                    key={subject.id}
                    id={subject.id}
                    name={subject.name}
                    hasSubcategories={subject.hasSubcategories}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Admin section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* No need for the invisible element anymore */}

        {showAdminLogin && !user && (
          <div className="max-w-md mx-auto">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Admin Login</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  
                  const formData = new FormData(e.currentTarget);
                  const email = formData.get('email') as string;
                  const password = formData.get('password') as string;
                  
                  if (!email || !password) {
                    toast({
                      variant: "destructive",
                      title: "Login Failed",
                      description: "Email and password are required",
                    });
                    return;
                  }
                  
                  setAdminLoginLoading(true);
                  try {
                    // Use our secure admin login API
                    const response = await fetch('/api/admin-login', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ email, password }),
                    });
                    
                    if (!response.ok) {
                      const errorData = await response.json();
                      toast({
                        variant: "destructive",
                        title: "Login Failed",
                        description: errorData.error || "Failed to authenticate as admin",
                      });
                      throw new Error(errorData.error || 'Failed to authenticate as admin');
                    }
                    
                    const data = await response.json();
                    
                    toast({
                      title: "Success",
                      description: "Admin login successful!",
                    });
                    
                    // Redirect to dashboard and refresh auth state
                    window.location.href = '/dashboard';
                    setShowAdminLogin(false);
                  } catch (error: any) {
                    console.error("Admin login error:", error);
                    toast({
                      variant: "destructive",
                      title: "Login Failed",
                      description: error.message || "An error occurred during login",
                    });
                  } finally {
                    setAdminLoginLoading(false);
                  }
                }}>
                  <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-gray-200">Email</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder="admin@example.com"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium text-gray-200">Password</label>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder="••••••••"
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                      disabled={adminLoginLoading}
                    >
                      {adminLoginLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Login as Admin"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {user && <AdminUploadForm />}
      </div>
      
      {/* Footer with hidden admin access */}
      <footer className="bg-gray-950 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div 
              className="text-xl font-bold text-white cursor-pointer" 
              onClick={handleLogoClick}
            >
              Exam<span className="text-yellow-400">Champ</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">© 2025 ExamChamp. All rights reserved.</p>
          </div>
          <div className="text-sm text-gray-400">
            {/* Hidden admin access - clicking on the logo will toggle admin login */}
            {process.env.NEXT_PUBLIC_CO_DEV_ENV === 'development' && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-500 hover:text-gray-300"
                onClick={() => {
                  setShowAdminLogin(true);
                  toast({
                    title: "Dev Mode",
                    description: "Admin login panel activated for development",
                  });
                }}
              >
                Dev Login
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}