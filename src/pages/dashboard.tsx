import React, { useEffect, useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import SubjectButton from '@/components/SubjectButton';
import AdminUploadForm from '@/components/AdminUploadForm';
import { Loader2, LogOut } from 'lucide-react';
import Header from '@/components/Header';

interface Subject {
  id: string;
  name: string;
  hasSubcategories: boolean;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

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

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        try {
          const response = await fetch('/api/check-admin');
          const data = await response.json();
          setIsAdmin(data.isAdmin);
        } catch (error) {
          console.error('Error checking admin status:', error);
        }
      }
    };

    checkAdmin();
  }, [user]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <Header />
      
      <main className="flex-grow">
        {/* Welcome Section */}
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Welcome to <span className="text-yellow-400">ExamChamp</span>
              </h1>
              <p className="text-lg text-gray-300 mb-6">
                Choose a subject to access practice papers sorted by year
              </p>
              {user && (
                <div className="flex justify-center gap-4 items-center">
                  <p className="text-gray-400">Logged in as: {user.email}</p>
                  <Button
                    onClick={() => signOut()}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subjects Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
                <p className="mb-4 text-gray-300">The database needs to be initialized with subjects.</p>
                <Button 
                  onClick={async () => {
                    try {
                      await fetch('/api/seed-subjects', { method: 'POST' });
                      window.location.reload();
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Display unique subjects */}
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

        {/* Admin Upload Section */}
        {isAdmin && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AdminUploadForm />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-xl font-bold text-white mb-2">
            Exam<span className="text-yellow-400">Champ</span>
          </div>
          <p className="text-sm text-gray-400">© 2025 ExamChamp. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}