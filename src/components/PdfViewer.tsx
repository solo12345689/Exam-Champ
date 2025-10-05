import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, X, RotateCw, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface PdfViewerProps {
  fileUrl: string;
  onClose: () => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ fileUrl, onClose }) => {
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Reset state when fileUrl changes
    setLoading(true);
    setCurrentPage(1);
    
    // Add event listener to detect when PDF is loaded
    const handleIframeLoad = () => {
      setLoading(false);
      // Try to get total pages - this is a best effort as it depends on the PDF viewer
      setTimeout(() => {
        try {
          if (iframeRef.current && iframeRef.current.contentWindow) {
            // This is a simplified approach - actual page count might require PDF.js integration
            setTotalPages(1); // Default to 1 if we can't determine
          }
        } catch (error) {
          console.error("Error accessing iframe content:", error);
        }
      }, 1000);
    };

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', handleIframeLoad);
    }

    return () => {
      if (iframe) {
        iframe.removeEventListener('load', handleIframeLoad);
      }
    };
  }, [fileUrl]);

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 2.5));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      navigateToPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      navigateToPage(currentPage - 1);
    }
  };

  const navigateToPage = (pageNum: number) => {
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        // This is a simplified approach - actual navigation depends on PDF viewer
        // Most PDF viewers support #page=N parameter
        iframeRef.current.src = `${fileUrl}#page=${pageNum}&zoom=${scale * 100}%`;
      }
    } catch (error) {
      console.error("Error navigating to page:", error);
    }
  };

  const preventDownload = () => {
    toast({
      title: "Download Restricted",
      description: "This document is for online viewing only and cannot be downloaded.",
      variant: "destructive"
    });
  };

  // Construct the URL with parameters to disable download options
  // Note: This is a best-effort approach as different PDF viewers have different capabilities
  const pdfViewerUrl = `${fileUrl}#zoom=${scale * 100}%&toolbar=0&navpanes=0&scrollbar=0`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      <div className="flex justify-between items-center p-4 bg-background">
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="icon" onClick={zoomIn} title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={zoomOut} title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <div className="mx-2 text-sm">
            Page {currentPage} of {totalPages}
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={prevPage} 
            disabled={currentPage <= 1}
            title="Previous Page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={nextPage} 
            disabled={currentPage >= totalPages}
            title="Next Page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={preventDownload}
            className="ml-2"
            title="Download Disabled"
          >
            <Download className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} title="Close">
          <X className="h-6 w-6" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-4 flex justify-center bg-gray-900">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background bg-opacity-50 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
        <iframe 
          ref={iframeRef}
          src={pdfViewerUrl}
          className="w-full h-full border-none bg-white"
          title="PDF Viewer"
          sandbox="allow-same-origin allow-scripts allow-forms"
          onContextMenu={(e) => e.preventDefault()} // Prevent right-click
        />
      </div>
    </div>
  );
};

export default PdfViewer;