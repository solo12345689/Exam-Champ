'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, X, ChevronLeft, ChevronRight, Download, RotateCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useIsIFrame } from '@/hooks/useIsIFrame';
import dynamic from 'next/dynamic';

// Import PDF.js dynamically to avoid SSR issues
const loadPdfJs = async () => {
  // @ts-ignore - PDF.js types are not included
  const pdfjs = await import('pdfjs-dist/build/pdf');
  
  // Set worker URL to a CDN version instead of importing it directly
  // This avoids issues with Next.js bundling
  pdfjs.GlobalWorkerOptions.workerSrc = 
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  
  return pdfjs;
};

interface PdfViewerAdvancedProps {
  fileUrl: string;
  onClose: () => void;
}

const PdfViewerAdvanced: React.FC<PdfViewerAdvancedProps> = ({ fileUrl, onClose }) => {
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);
  const { toast } = useToast();
  const isIframe = useIsIFrame();

  // Load PDF document
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadPdf = async () => {
      try {
        const pdfjs = await loadPdfJs();
        const loadingTask = pdfjs.getDocument(fileUrl);
        
        loadingTask.promise.then(
          (pdfDoc: any) => {
            if (!isMounted) return;
            
            pdfDocRef.current = pdfDoc;
            setTotalPages(pdfDoc.numPages);
            setCurrentPage(1);
            renderPage(1, pdfDoc);
          },
          (reason: any) => {
            if (!isMounted) return;
            console.error('Error loading PDF:', reason);
            setError('Failed to load PDF. Please try again later.');
            setLoading(false);
          }
        );
      } catch (err) {
        if (!isMounted) return;
        console.error('Error initializing PDF.js:', err);
        setError('Failed to initialize PDF viewer. Please try again later.');
        setLoading(false);
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [fileUrl]);

  // Render PDF page
  const renderPage = async (pageNum: number, pdfDoc = pdfDocRef.current) => {
    if (!pdfDoc || !canvasRef.current) return;
    
    setLoading(true);
    try {
      const page = await pdfDoc.getPage(pageNum);
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        setError('Canvas context not available');
        setLoading(false);
        return;
      }
      
      // Calculate viewport to fit container width
      let viewport = page.getViewport({ scale: 1.0, rotation });
      
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 40; // Subtract padding
        const containerHeight = containerRef.current.clientHeight - 40;
        
        // Calculate scale to fit width
        const widthScale = containerWidth / viewport.width;
        const heightScale = containerHeight / viewport.height;
        
        // Use the smaller scale to ensure it fits in the container
        const fitScale = Math.min(widthScale, heightScale);
        
        // Apply user zoom on top of fit scale
        const finalScale = fitScale * scale;
        
        viewport = page.getViewport({ scale: finalScale, rotation });
      }
      
      // Set canvas dimensions to match viewport
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Render PDF page
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      setLoading(false);
    } catch (err) {
      console.error('Error rendering page:', err);
      setError('Failed to render PDF page. Please try again later.');
      setLoading(false);
    }
  };

  // Handle page navigation
  const goToPage = (pageNum: number) => {
    if (pageNum < 1 || pageNum > totalPages) return;
    setCurrentPage(pageNum);
    renderPage(pageNum);
  };

  // Zoom controls
  const zoomIn = () => {
    const newScale = Math.min(scale + 0.2, 3.0);
    setScale(newScale);
    renderPage(currentPage);
  };

  const zoomOut = () => {
    const newScale = Math.max(scale - 0.2, 0.5);
    setScale(newScale);
    renderPage(currentPage);
  };

  // Rotation control
  const rotate = () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    renderPage(currentPage);
  };

  // Prevent download
  const preventDownload = () => {
    toast({
      title: "Download Restricted",
      description: "This document is for online viewing only and cannot be downloaded.",
      variant: "destructive"
    });
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      renderPage(currentPage);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [currentPage]);

  // Prevent context menu (right-click)
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // If we're in an iframe, don't render the viewer (security measure)
  if (isIframe) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>PDF viewing is not available in embedded frames for security reasons.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Toolbar */}
      <div className="flex justify-between items-center p-4 bg-background">
        <div className="flex gap-2 items-center flex-wrap">
          <Button variant="outline" size="icon" onClick={zoomIn} title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={zoomOut} title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={rotate} title="Rotate">
            <RotateCw className="h-4 w-4" />
          </Button>
          <div className="mx-2 text-sm">
            Page {currentPage} of {totalPages}
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => goToPage(currentPage - 1)} 
            disabled={currentPage <= 1 || loading}
            title="Previous Page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => goToPage(currentPage + 1)} 
            disabled={currentPage >= totalPages || loading}
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
      
      {/* PDF Viewer */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto p-4 flex justify-center items-center bg-gray-900"
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background bg-opacity-50 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
          </div>
        )}
        
        <canvas 
          ref={canvasRef} 
          className="shadow-lg"
        />
      </div>
    </div>
  );
};

export default PdfViewerAdvanced;