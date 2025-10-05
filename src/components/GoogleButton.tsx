import { AuthContext } from "@/contexts/AuthContext";
import { useContext, useState } from "react";
import { FcGoogle } from 'react-icons/fc';
import { useIsIFrame } from "@/hooks/useIsIFrame";
import { useToast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const GoogleButton = () => {
  const { signInWithGoogle } = useContext(AuthContext);
  const isIframe = useIsIFrame();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };
  
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      if (error.message?.includes('provider is not enabled')) {
        toast({
          variant: "destructive",
          title: "Google Authentication Not Configured",
          description: "Unsupported provider: provider is not enabled"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: error.message || "Failed to sign in with Google"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const button = (
    <button
      onClick={handleGoogleSignIn}
      disabled={isIframe || isLoading}
      className={`w-full flex items-center justify-center px-4 py-2 border border-neutral-700 rounded-md text-neutral-100 bg-neutral-800 ${
        !isIframe && !isLoading && "hover:bg-neutral-700"
      } transition-colors duration-200 ${
        (isIframe || isLoading) && "opacity-50 cursor-not-allowed"
      }`}
    >
      <FcGoogle className="mr-2" />
      Continue with Google
    </button>
  );

  return (
    <div className="h-10 w-full">
      {isIframe ? (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent>
              <div>
                <p>Google Sign In is only available in the browser, not within developer mode. Click <button onClick={handleOpenNewTab} className="text-blue-500 hover:underline">here</button> to open in a new tab.</p>
                <p>Make sure Google Sign In is configured in your Supabase project settings.</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent>
              <p>Make sure Google Sign In is configured in your Supabase project settings.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default GoogleButton;
