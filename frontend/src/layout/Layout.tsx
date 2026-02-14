import { useLocation, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

import bgImage from '@/assets/images/common/bg-2.svg';
import misteoLogo from '@/assets/images/common/misteo-large.png';

import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';

import { AppSidebar } from './app-sidebar';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: React.ReactNode;
}

const AuthToggleButton = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isLogin = location.pathname === '/signup';
  const togglePath = isLogin ? '/' : '/signup';
  const buttonLabel = isLogin ? 'Sign In' : 'Sign Up';

  return <Button onClick={() => navigate(togglePath)}>{buttonLabel}</Button>;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const authRoutes = useMemo(
    () => [
      '/',
      '/signup',
      '/verify',
      '/forgot-password',
      '/setup',
      '/create-password',
      '/forgot-password/success',
    ],
    [],
  );

  if (authRoutes.includes(location.pathname)) {
    return (
      <div className="container relative hidden h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r">
          <img
            src={bgImage}
            alt="Agrylitics"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/10" />
        </div>
        <div className="lg:p-4 h-full grid grid-rows-[auto_1fr]">
          <div className="px-4 flex items-center justify-end">
            <div className="text-center mt-4">
              <AuthToggleButton />
            </div>
          </div>
          <div className="flex items-center justify-center p-4">
            <Card className="max-w-full overflow-hidden p-1">
              <div className="p-4">{children}</div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar className="border-r">
          <div className="h-16 px-6 flex items-center border-b">
            <img src={misteoLogo} alt="Logo" className="h-6" />
          </div>
          <AppSidebar />
        </Sidebar>

        {/* Sidebar Inset (Layout Shell) */}
        <SidebarInset>
          {/* Sticky Header */}
          <header className="bg-background sticky top-0 z-10 flex h-16 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
          </header>

          {/* Scrollable Page Content */}
          <main className="flex-1 overflow-auto p-4 thin-scrollbar">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
