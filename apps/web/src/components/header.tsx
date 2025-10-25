'use client';
import { useTypedTranslation } from '@/lib/useTypedTranslation';
import { LogOut, Menu, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/lib/auth-context';
import { LanguageToggle } from './language-toggle';
import { ModeToggle } from './mode-toggle';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';

export default function Header() {
  const { t } = useTypedTranslation();
  const pathname = usePathname();
  const { session, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const links = [
    { to: '/', label: 'Home' },
    { to: '/pricing', label: 'Pricing' },
  ];

  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="bg-background/50 backdrop-blur-sm border-b fixed top-0 left-0 right-0 z-50 shadow-sm">
      <div className="relative flex flex-row items-center justify-between px-4 h-16">
        <Link href="/" className="flex items-center">
          <h1 className="text-2xl font-bold text-primary">Convex Template</h1>
        </Link>
        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6 text-sm font-medium absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 h-full">
          {links.map(({ to, label }) => {
            const isActive = pathname === to;
            return (
              <Link
                key={to}
                href={to}
                className={`transition-colors h-full flex items-center hover:text-foreground/80 ${
                  isActive ? 'text-primary' : 'text-foreground/60'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-4">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-3 mt-6">
                {links.map(({ to, label }) => {
                  const isActive = pathname === to;
                  return (
                    <Link
                      key={to}
                      href={to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`text-left px-3 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground ${
                        isActive
                          ? 'bg-accent text-accent-foreground font-medium'
                          : 'text-foreground/70 hover:text-foreground'
                      }`}
                    >
                      {label}
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Auth Section */}
              <div className="mt-6 pt-6 border-t">
                {session?.user ? (
                  <div className="space-y-4">
                    <Button
                      onClick={handleSignOut}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('auth.logout')}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/auth/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Button variant="outline" className="w-full">
                        {t('auth.login')}
                      </Button>
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Button className="w-full">{t('auth.signup')}</Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Controls */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Theme</span>
                  <ModeToggle />
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm font-medium">Language</span>
                  <LanguageToggle />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Right Side Controls */}
        <div className="hidden md:flex items-center gap-2">
          <LanguageToggle />
          <ModeToggle />

          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <User className="h-[1.2rem] w-[1.2rem]" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('auth.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  {t('auth.login')}
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">{t('auth.signup')}</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
