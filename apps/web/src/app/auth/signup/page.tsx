'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuthMutation } from '@/hooks/useConvexQuery';
import { useAuth } from '@/lib/auth-context';
import { useTypedTranslation } from '@/lib/useTypedTranslation';
import { api } from '@invoice-tracker/backend/convex/_generated/api';
import {
  Calculator,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  User,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { toast } from 'sonner';

type OrganizationType = 'personal' | 'business' | 'accounting';

export const dynamic = 'force-dynamic';

function SignupContent() {
  const { t } = useTypedTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp } = useAuth();
  const returnUrl = searchParams.get('returnUrl');

  // User info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const handleUserInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast.error(t('common.pleaseEnterBothEmailAndPassword'));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('auth.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      toast.error(t('common.passwordMinLength'));
      return;
    }

    try {
      setIsLoading(true);
      await signUp.email({ email, password, name });
      router.push(returnUrl || '/');
    } catch (error) {
      toast.error(t('auth.signupFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">{t('auth.signup')}</CardTitle>
        <CardDescription>{t('auth.createAccount')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUserInfoSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('auth.fullName')}</Label>
            <Input
              id="name"
              type="text"
              placeholder={t('common.enterFullName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('common.enterEmail')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('common.createPassword')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder={t('common.confirmPassword')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {t('common.next')}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">{t('auth.hasAccount')} </span>
          <Link
            href={
              returnUrl
                ? `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`
                : '/auth/login'
            }
            className="text-primary hover:underline"
          >
            {t('auth.signIn')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Suspense
        fallback={
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Loading...</CardTitle>
              <CardDescription>Please wait</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Loading signup form...</p>
              </div>
            </CardContent>
          </Card>
        }
      >
        <SignupContent />
      </Suspense>
    </div>
  );
}
