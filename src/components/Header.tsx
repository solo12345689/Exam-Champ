import { useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import { Button } from "@/components/ui/button";
import { User } from 'lucide-react';

const Header = () => {
  const { user, initializing, signOut } = useContext(AuthContext);
  const router = useRouter();

  const handleButtonClick = () => {
    if (user && router.pathname === '/dashboard') {
      signOut();
      router.push('/');
    } else {
      router.push(user ? "/dashboard" : "/login");
    }
  };

  const buttonText = () => {
    if (user && router.pathname === '/dashboard') {
      return "Log out";
    }
    return user ? "Dashboard" : "Login";
  };

  return (
    <header className="w-full bg-gray-900">
      <div className="flex justify-between items-center py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="cursor-pointer" onClick={() => router.push("/")}>
          <Logo />
        </div>
        {!initializing && (
          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleButtonClick}
              variant={user ? "default" : "outline"}
              size="sm"
              className={user ? "bg-yellow-500 hover:bg-yellow-600 text-black" : "border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"}
            >
              {user ? (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {buttonText()}
                </div>
              ) : (
                buttonText()
              )}
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;