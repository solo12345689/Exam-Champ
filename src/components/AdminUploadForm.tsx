import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Loader2, Database, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Subject {
  id: string;
  name: string;
  hasSubcategories: boolean;
}

interface SubCategory {
  id: string;
  name: string;
  subjectId: string;
}

const AdminUploadForm: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [isInitializingStorage, setIsInitializingStorage] = useState(false);
  const [storageInitialized, setStorageInitialized] = useState(false);

  const initializeStorage = async () => {
    setIsInitializingStorage(true);
    
    try {
      toast({
        title: "Initializing Storage",
        description: "Setting up storage for file uploads...",
      });
      
      const response = await fetch('/api/create-papers-bucket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initialize storage');
      }
      
      const data = await response.json();
      
      setStorageInitialized(true);
      toast({
        title: "Storage Initialized",
        description: data.message || "Storage system is ready for uploads.",
      });
    } catch (error) {
      console.error('Error initializing storage:', error);
      toast({
        variant: "destructive",
        title: "Initialization Failed",
        description: error instanceof Error ? error.message : "Failed to initialize storage. Please try again.",
      });
    } finally {
      setIsInitializingStorage(false);
    }
  };

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        try {
          // Use a more robust fetch with timeout and error handling
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          const response = await fetch('/api/check-admin', {
            signal: controller.signal,
            credentials: 'include' // Ensure cookies are sent
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          const data = await response.json();
          setIsAdmin(data.isAdmin);
        } catch (error) {
          console.error('Error checking admin status:', error);
          // Fallback to checking if the user's email matches the admin email
          if (user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
            console.log('Setting admin status based on email match');
            setIsAdmin(true);
          }
        }
      }
    };

    checkAdmin();
  }, [user]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch('/api/subjects');
        const data = await response.json();
        setSubjects(data);
      } catch (error) {
        console.error('Error fetching subjects:', error);
      }
    };

    fetchSubjects();
  }, []);

  useEffect(() => {
    const fetchSubCategories = async () => {
      if (selectedSubject) {
        try {
          const response = await fetch(`/api/subcategories?subjectId=${selectedSubject}`);
          const data = await response.json();
          setSubCategories(data);
        } catch (error) {
          console.error('Error fetching subcategories:', error);
        }
      } else {
        setSubCategories([]);
      }
    };

    fetchSubCategories();
  }, [selectedSubject]);

  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
    setSelectedSubCategory('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSubject || !year || !file) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill all required fields",
      });
      return;
    }

    const selectedSubjectObj = subjects.find(s => s.id === selectedSubject);
    if (selectedSubjectObj?.hasSubcategories && !selectedSubCategory) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a subcategory",
      });
      return;
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload a PDF file only",
      });
      return;
    }

    // Validate file size (max 50MB - Supabase storage limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Please upload a file smaller than 50MB. This is a limitation of our storage provider.",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setRetryCount(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subjectId', selectedSubject);
      formData.append('year', year);
      
      if (topic) {
        formData.append('topic', topic);
      }
      
      if (selectedSubCategory) {
        formData.append('subCategoryId', selectedSubCategory);
      }

      console.log('Uploading paper:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        subject: selectedSubject,
        subCategory: selectedSubCategory || 'none',
        year,
        topic: topic || 'none'
      });

      // Use XMLHttpRequest for upload progress tracking
      await new Promise<void>((resolve, reject) => {
        // Create a new XMLHttpRequest with better error handling
        const xhr = new XMLHttpRequest();
        
        // Set response type to json to help with parsing
        xhr.responseType = 'json';
        
        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
            
            // Show progress in toast for large files
            if (file.size > 50 * 1024 * 1024 && percentComplete % 10 === 0) { // Update every 10%
              toast({
                title: "Uploading...",
                description: `${percentComplete}% complete`,
              });
            }
          }
        });
        
        xhr.addEventListener('load', () => {
          // Log the full response for debugging
          console.log('XHR load event - status:', xhr.status);
          console.log('XHR load event - response type:', xhr.responseType);
          console.log('XHR load event - content-type:', xhr.getResponseHeader('content-type'));
          
          // Log the full response object for debugging
          if (xhr.responseType === 'json') {
            console.log('XHR load event - full response object:', xhr.response);
          }
          
          if (xhr.status >= 200 && xhr.status < 300) {
            let response;
            
            try {
              // Try to get the response based on responseType first
              if (xhr.responseType === 'json' && xhr.response) {
                response = xhr.response;
              } else if (xhr.responseType !== 'json') {
                // Only try to parse responseText if responseType is not 'json'
                try {
                  response = JSON.parse(xhr.responseText);
                } catch (parseError) {
                  console.error('Error parsing success responseText:', parseError);
                  response = { success: true }; // Assume success if we can't parse
                }
              } else {
                // If responseType is 'json' but response is empty/null
                console.warn('Empty JSON response received on successful upload');
                response = { success: true }; // Assume success
              }
              
              console.log('Upload success response:', response);
              
              toast({
                title: "Success",
                description: "Paper uploaded successfully",
              });
              
              // Reset form
              setSelectedSubject('');
              setSelectedSubCategory('');
              setYear('');
              setTopic('');
              setFile(null);
              
              // Reset file input
              const fileInput = document.getElementById('file-upload') as HTMLInputElement;
              if (fileInput) {
                fileInput.value = '';
              }
              
              setIsUploading(false);
              resolve();
            } catch (e) {
              console.error('Error parsing success response:', e);
              toast({
                title: "Success",
                description: "Paper uploaded successfully, but response parsing failed",
              });
              setIsUploading(false);
              resolve();
            }
          } else {
            let errorMessage = 'Failed to upload paper';
            let errorDetails = '';
            
            console.log('Upload error - status:', xhr.status);
            console.log('Upload error - statusText:', xhr.statusText);
            
            // Don't try to access responseText when responseType is 'json'
            if (xhr.responseType === 'json') {
              console.log('Upload error - response:', xhr.response);
            } else {
              try {
                console.log('Upload error - responseText:', xhr.responseText);
              } catch (e) {
                console.log('Could not access responseText due to responseType setting');
              }
            }
            
            try {
              // Try to get the error response
              let errorResponse;
              
              // Check if response is JSON before trying to parse it
              const contentType = xhr.getResponseHeader('content-type');
              if (contentType && contentType.includes('application/json')) {
                if (xhr.responseType === 'json' && xhr.response) {
                  errorResponse = xhr.response;
                } else if (xhr.responseType !== 'json') {
                  // Only try to parse responseText if responseType is not 'json'
                  try {
                    errorResponse = JSON.parse(xhr.responseText);
                  } catch (parseError) {
                    console.error('Error parsing responseText:', parseError);
                    errorResponse = { error: 'Failed to parse server response' };
                  }
                } else {
                  // If responseType is 'json' but response is empty/null
                  errorResponse = { error: 'Empty or invalid server response' };
                }
                
                console.log('Parsed error response:', errorResponse);
                
                if (errorResponse) {
                  errorMessage = errorResponse.error || 'Failed to upload paper';
                  errorDetails = errorResponse.details || '';
                  
                  // Log the full error response for debugging
                  console.log('Full error response:', errorResponse);
                  
                  // Handle specific error cases
                  if (errorDetails.includes('Bucket not found')) {
                    errorMessage = 'Storage configuration issue';
                    errorDetails = 'The system is setting up storage for the first time. Please try again in a few seconds.';
                    
                    // Show a more helpful toast for this specific error
                    toast({
                      variant: "default",
                      title: "Setting up storage...",
                      description: "First-time setup in progress. Please try again in a few seconds.",
                    });
                    
                    // Auto-retry after a short delay
                    setTimeout(() => {
                      toast({
                        title: "Ready to retry",
                        description: "Storage setup completed. Please try uploading again.",
                      });
                    }, 5000);
                  }
                }
              } else {
                // Handle non-JSON responses
                errorDetails = `Server returned status ${xhr.status}: ${xhr.statusText}`;
              }
            } catch (e) {
              console.error('Error parsing error response:', e);
              errorDetails = `Failed to parse error response (${xhr.status})`;
            }
            
            // Provide more specific error message based on the error
            let toastMessage = errorDetails || errorMessage;
            
            // Check for specific error types and provide more helpful messages
            if (errorMessage.includes('storage') || errorDetails.includes('storage')) {
              // Handle specific Supabase storage errors
              if (errorMessage.includes('row-level security policy') || errorDetails.includes('row-level security policy')) {
                toastMessage = "Storage permission error: The system doesn't have permission to save files. Please contact support.";
              } else if (errorMessage.includes('bucket') || errorDetails.includes('bucket')) {
                toastMessage = "Storage configuration error: The storage bucket is not properly configured. Please contact support.";
              } else {
                toastMessage = "Storage error: The file couldn't be saved. Please try again or contact support.";
              }
            } else if (errorMessage.includes('database') || errorDetails.includes('database')) {
              toastMessage = "Database error: Your file was uploaded but couldn't be saved in our records. Please try again.";
            } else if (xhr.status === 413) {
              toastMessage = "The file is too large for the server to process. Please try a smaller file.";
            } else if (xhr.status === 504 || xhr.status === 502) {
              toastMessage = "The server took too long to respond. This might happen with large files. Please try again.";
            }
            
            toast({
              variant: "destructive",
              title: "Upload Failed",
              description: toastMessage,
            });
            
            setIsUploading(false);
            reject(new Error(toastMessage)); // Use the more detailed message for the error
          }
        });
        
        xhr.addEventListener('error', (event) => {
          // Log more detailed information about the error
          console.error('XHR error event:', JSON.stringify(event));
          console.error('XHR error details - readyState:', xhr.readyState);
          console.error('XHR error details - status:', xhr.status);
          console.error('XHR error details - statusText:', xhr.statusText);
          
          // Check if it's a network connectivity issue
          if (!navigator.onLine) {
            toast({
              variant: "destructive",
              title: "Network Offline",
              description: "Your internet connection appears to be offline. Please check your connection and try again.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Upload Failed",
              description: "Network error occurred during upload. Please try again.",
            });
          }
          
          setIsUploading(false);
          reject(new Error('Network error occurred during upload'));
        });
        
        xhr.addEventListener('abort', (event) => {
          console.error('XHR abort event:', event);
          toast({
            variant: "destructive",
            title: "Upload Cancelled",
            description: "File upload was cancelled",
          });
          
          setIsUploading(false);
          reject(new Error('Upload cancelled'));
        });
        
        // Add timeout handler
        xhr.timeout = file.size > 50 * 1024 * 1024 ? 600000 : 300000; // 10 min for large files, 5 min otherwise
        xhr.ontimeout = () => {
          toast({
            variant: "destructive",
            title: "Upload Timeout",
            description: "The upload took too long and timed out. Please try again with a smaller file or check your connection.",
          });
          
          setIsUploading(false);
          reject(new Error('Upload timed out'));
        };
        
        // Add network state change listeners to detect connectivity issues
        window.addEventListener('online', function() {
          if (xhr.readyState > 0 && xhr.readyState < 4) {
            toast({
              title: "Connection Restored",
              description: "Your internet connection is back. The upload will continue.",
            });
          }
        }, { once: true });
        
        window.addEventListener('offline', function() {
          if (xhr.readyState > 0 && xhr.readyState < 4) {
            toast({
              variant: "destructive",
              title: "Connection Lost",
              description: "Your internet connection was lost. The upload will continue when you're back online.",
            });
          }
        }, { once: true });
        
        try {
          // Add a timestamp to the URL to prevent caching issues
          const timestamp = new Date().getTime();
          xhr.open('POST', `/api/upload-paper?t=${timestamp}`);
          
          // Set a longer timeout for large files
          xhr.timeout = file.size > 50 * 1024 * 1024 ? 600000 : 300000; // 10 min for large files, 5 min otherwise
          
          // Add additional debugging headers
          xhr.setRequestHeader('X-File-Size', file.size.toString());
          xhr.setRequestHeader('X-File-Name', file.name);
          
          // Log request start for debugging
          console.log('Starting upload request with file:', {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified).toISOString()
          });
          
          xhr.send(formData);
          
          console.log('Upload request initiated successfully');
        } catch (e) {
          console.error('Error initiating XHR request:', e);
          const errorMessage = e instanceof Error ? e.message : 'Unknown error';
          console.error('XHR initialization error details:', errorMessage);
          
          toast({
            variant: "destructive",
            title: "Upload Failed",
            description: `Failed to start upload: ${errorMessage}. Please try again.`,
          });
          setIsUploading(false);
          reject(new Error(`Failed to initiate upload request: ${errorMessage}`));
        }
      });
    } catch (error: any) {
      console.error('Error uploading paper:', error);
      
      // Log detailed error information
      console.error('Upload error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      });
      
      // Implement retry logic for network errors and certain types of server errors
      const isNetworkError = error.message.includes('Network') || 
                            error.message.includes('network') || 
                            error.message.includes('timeout') ||
                            error.message.includes('connection');
      
      const isServerError = error.message.includes('500') || 
                           error.message.includes('503') || 
                           error.message.includes('502');
      
      if (retryCount < 2 && (isNetworkError || isServerError)) {
        setRetryCount(prev => prev + 1);
        
        // Exponential backoff - wait longer for each retry
        const backoffTime = 2000 * Math.pow(2, retryCount);
        
        toast({
          title: "Retrying Upload",
          description: `Automatically retrying upload (attempt ${retryCount + 1}/3) in ${backoffTime/1000} seconds...`,
        });
        
        // Wait with exponential backoff before retrying
        setTimeout(() => {
          handleSubmit(e);
        }, backoffTime);
      } else {
        // Provide a more detailed error message
        let errorDescription = error.message || "Failed to upload paper. Please try again.";
        
        // Add more context if it's a network error
        if (isNetworkError) {
          errorDescription += " This appears to be a network issue. Please check your internet connection and try again.";
        }
        
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: errorDescription,
        });
        setIsUploading(false);
      }
    }
  };

  if (!isAdmin) return null;

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Exam Paper
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!storageInitialized && (
          <Alert className="mb-4 bg-amber-50">
            <AlertDescription>
              If you're experiencing upload issues, try initializing the storage system first.
            </AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select value={selectedSubject} onValueChange={handleSubjectChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedSubject && subjects.find(s => s.id === selectedSubject)?.hasSubcategories && (
            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Select value={selectedSubCategory} onValueChange={setSelectedSubCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {subCategories.map((subCategory) => (
                    <SelectItem key={subCategory.id} value={subCategory.id}>
                      {subCategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              type="number"
              min="2000"
              max={new Date().getFullYear()}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Enter year (e.g., 2023)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Paper Topic/Name (Optional)</Label>
            <Input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter paper topic or name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">PDF File</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum file size: 50MB. Please ensure your PDF is optimized for web.
            </p>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading file...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-gray-400 mt-1">
                {file && (file.size > 100 * 1024 * 1024) ? 
                  "Large file uploads may take several minutes. Please don't close this window." : 
                  "Please wait while your file uploads."}
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isUploading || isInitializingStorage}>
            {isUploading ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </div>
            ) : 'Save Paper'}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full flex items-center gap-2" 
          onClick={initializeStorage}
          disabled={isInitializingStorage || isUploading || storageInitialized}
        >
          {isInitializingStorage ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Initializing Storage...
            </>
          ) : storageInitialized ? (
            <>
              <Database className="h-4 w-4" />
              Storage Ready
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Initialize Storage System
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AdminUploadForm;