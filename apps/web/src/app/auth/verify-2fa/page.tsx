'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Loader2, AlertCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';

export default function Verify2FAPage() {
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6).split('');
      const newCode = [...code];
      pastedCode.forEach((digit, i) => {
        if (index + i < 6) {
          newCode[index + i] = digit;
        }
      });
      setCode(newCode);

      // Focus last filled input or next empty one
      const nextIndex = Math.min(index + pastedCode.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    // Handle single digit
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Move to next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = useBackupCode ? backupCode : code.join('');

    if (useBackupCode && !backupCode) {
      toast.error('Please enter a backup code');
      return;
    }

    if (!useBackupCode && fullCode.length !== 6) {
      toast.error('Please enter a complete 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      let result;
      if (useBackupCode) {
        result = await authClient.twoFactor.verifyBackupCode({
          code: backupCode,
          trustDevice: true,
        });
      } else {
        result = await authClient.twoFactor.verifyTotp({
          code: fullCode,
          trustDevice: true,
        });
      }

      if (result.error) {
        toast.error(result.error.message || 'Invalid code');
        setCode(['', '', '', '', '', '']);
        setBackupCode('');
        inputRefs.current[0]?.focus();
      } else {
        toast.success('Verification successful!');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      toast.error('Verification failed. Please try again.');
      setCode(['', '', '', '', '', '']);
      setBackupCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      await authClient.twoFactor.sendOtp({
        // trustDevice: false,
      });
      toast.success('New code sent to your email');
    } catch (error) {
      console.error('Resend code error:', error);
      toast.error('Failed to send new code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            {useBackupCode
              ? 'Enter one of your backup codes'
              : 'Enter the 6-digit code from your authenticator app or email'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!useBackupCode ? (
            <>
              <div className="flex justify-center gap-2">
                {code.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                      return;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]"
                    maxLength={6}
                    className="w-12 h-12 text-center text-lg font-semibold"
                    value={digit}
                    onChange={(e) =>
                      handleCodeChange(index, e.target.value.replace(/\D/g, ''))
                    }
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={isLoading}
                  />
                ))}
              </div>

              <Button
                className="w-full"
                onClick={handleVerify}
                disabled={isLoading || code.join('').length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
            </>
          ) : (
            <>
              <Input
                type="text"
                placeholder="Enter backup code"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value)}
                disabled={isLoading}
              />
              <Button
                className="w-full"
                onClick={handleVerify}
                disabled={isLoading || !backupCode}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Backup Code'
                )}
              </Button>
            </>
          )}

          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setCode(['', '', '', '', '', '']);
                setBackupCode('');
              }}
            >
              {useBackupCode
                ? 'Use authenticator code instead'
                : 'Use backup code instead'}
            </Button>

            {!useBackupCode && (
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={handleResendCode}
                disabled={isLoading}
              >
                Resend code
              </Button>
            )}
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              If you've lost access to your authenticator app and backup codes,
              please contact support for assistance.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
