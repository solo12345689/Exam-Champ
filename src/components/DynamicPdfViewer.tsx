import dynamic from 'next/dynamic';

// Dynamically import the PDF viewer component with SSR disabled
// This ensures it only loads on the client side where browser APIs are available
const DynamicPdfViewer = dynamic(
  () => import('./PdfViewerAdvanced'),
  { 
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }
);

export default DynamicPdfViewer;