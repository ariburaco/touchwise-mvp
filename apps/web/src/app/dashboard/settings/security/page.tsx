'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Key,
  Smartphone,
  AlertCircle,
  Check,
  X,
  Loader2,
  Copy,
  Link2,
  LogOut,
  Monitor,
  Globe,
  Clock,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { authClient, type User } from '@/lib/auth-client';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { session, refetchSession } = useAuth();

  // State for password change
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // State for 2FA
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [totpUri, setTotpUri] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState<
    'setup' | 'verify' | 'backup'
  >('setup');

  // State for sessions
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isRevokingSession, setIsRevokingSession] = useState<string | null>(
    null
  );

  // State for linked accounts
  const [linkedAccounts, setLinkedAccounts] = useState<any[]>([]);
  const [isLinkingAccount, setIsLinkingAccount] = useState<string | null>(null);

  // Check 2FA status
  useEffect(() => {
    if (session?.user) {
      // Set 2FA status from session - Better Auth stores this field
      setTwoFactorEnabled(session.user?.twoFactorEnabled === true);
      fetchSessions();
      fetchLinkedAccounts();
    }
  }, [session]);

  const fetchSessions = async () => {
    try {
      const result = await authClient.listSessions();
      if (result.data) {
        setSessions(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const fetchLinkedAccounts = async () => {
    try {
      // Fetch linked accounts from the server
      // This would need an API endpoint to get linked accounts
      // For now we'll use an empty array
      setLinkedAccounts([]);
    } catch (error) {
      console.error('Failed to fetch linked accounts:', error);
    }
  };

  // Password change handler
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      // Check if the result has an error
      if (result.error) {
        // Extract the actual error message from Better Auth
        const errorMessage =
          result.error.message || 'Failed to change password';
        console.error('Password change error:', result.error);
        toast.error(errorMessage);
        return;
      }

      toast.success('Password changed successfully');
      setShowPasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      refetchSession();
    } catch (error: any) {
      // Handle any thrown errors
      console.error('Password change error:', error);
      const errorMessage = error?.message || 'Failed to change password';
      toast.error(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // 2FA setup handlers
  const handle2FASetup = async () => {
    setIs2FALoading(true);
    try {
      const result = await authClient.twoFactor.enable({
        password: currentPassword,
      });

      if (result.error) {
        const errorMessage = result.error.message || 'Failed to enable 2FA';
        console.error('2FA setup error:', result.error);
        toast.error(errorMessage);
        return;
      }

      if (result.data) {
        setTotpUri(result.data.totpURI);
        setBackupCodes(result.data.backupCodes);
        setTwoFactorStep('verify');
      }
    } catch (error: any) {
      console.error('2FA setup error:', error);
      const errorMessage = error?.message || 'Failed to enable 2FA';
      toast.error(errorMessage);
    } finally {
      setIs2FALoading(false);
    }
  };

  const handle2FAVerification = async () => {
    setIs2FALoading(true);
    try {
      const result = await authClient.twoFactor.verifyTotp({
        code: verificationCode,
      });

      if (result.error) {
        const errorMessage =
          result.error.message || 'Invalid verification code';
        console.error('2FA verification error:', result.error);
        toast.error(errorMessage);
        return;
      }

      if (result.data) {
        setTwoFactorStep('backup');
        setTwoFactorEnabled(true);
        toast.success('2FA enabled successfully');
        // Refetch session to update user data
        setTimeout(() => refetchSession(), 500);
      }
    } catch (error: any) {
      console.error('2FA verification error:', error);
      const errorMessage = error?.message || 'Failed to verify code';
      toast.error(errorMessage);
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable 2FA?')) {
      return;
    }

    setIs2FALoading(true);
    try {
      const result = await authClient.twoFactor.disable({
        password: currentPassword,
      });

      if (result.error) {
        const errorMessage = result.error.message || 'Failed to disable 2FA';
        console.error('2FA disable error:', result.error);
        toast.error(errorMessage);
        return;
      }

      setTwoFactorEnabled(false);
      toast.success('2FA disabled successfully');
      setShow2FADialog(false);
      setCurrentPassword('');
      // Refetch session to update user data
      setTimeout(() => refetchSession(), 500);
    } catch (error: any) {
      console.error('2FA disable error:', error);
      const errorMessage = error?.message || 'Failed to disable 2FA';
      toast.error(errorMessage);
    } finally {
      setIs2FALoading(false);
    }
  };

  // Session management
  const handleRevokeSession = async (sessionId: string) => {
    setIsRevokingSession(sessionId);
    try {
      const result = await authClient.revokeSession({
        token: sessionId,
      });

      if (result.error) {
        const errorMessage = result.error.message || 'Failed to revoke session';
        console.error('Session revoke error:', result.error);
        toast.error(errorMessage);
        return;
      }

      toast.success('Session revoked');
      fetchSessions();
    } catch (error: any) {
      console.error('Session revoke error:', error);
      const errorMessage = error?.message || 'Failed to revoke session';
      toast.error(errorMessage);
    } finally {
      setIsRevokingSession(null);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm('This will log you out from all devices. Continue?')) {
      return;
    }

    try {
      const result = await authClient.revokeOtherSessions();

      if (result.error) {
        const errorMessage =
          result.error.message || 'Failed to revoke sessions';
        console.error('Revoke all sessions error:', result.error);
        toast.error(errorMessage);
        return;
      }

      toast.success('All other sessions revoked');
      fetchSessions();
    } catch (error: any) {
      console.error('Revoke all sessions error:', error);
      const errorMessage = error?.message || 'Failed to revoke sessions';
      toast.error(errorMessage);
    }
  };

  // Account linking
  const handleLinkAccount = async (provider: 'google' | 'github') => {
    setIsLinkingAccount(provider);
    try {
      await authClient.linkSocial({
        provider,
        callbackURL: '/dashboard/settings/security',
      });
    } catch (error) {
      console.error('Account linking error:', error);
      toast.error(`Failed to link ${provider} account`);
      setIsLinkingAccount(null);
    }
  };

  // Commented out until we have a way to display linked accounts
  // const handleUnlinkAccount = async (providerId: string, accountId: string) => {
  //   if (!confirm('Are you sure you want to unlink this account?')) {
  //     return;
  //   }

  //   try {
  //     await authClient.unlinkAccount({
  //       providerId,
  //       accountId,
  //     });

  //     toast.success('Account unlinked');
  //     fetchLinkedAccounts();
  //   } catch (error) {
  //     console.error('Account unlink error:', error);
  //     toast.error('Failed to unlink account');
  //   }
  // };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast.success('Backup codes copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Settings</h1>
        <p className="text-muted-foreground">
          Manage your account security and authentication methods
        </p>
      </div>

      {/* Password Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Password
          </CardTitle>
          <CardDescription>
            Manage your password and authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Password</p>
              <p className="text-sm text-muted-foreground">
                Update your account password
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowPasswordDialog(true)}
            >
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-medium">2FA Status</p>
                <p className="text-sm text-muted-foreground">
                  {twoFactorEnabled
                    ? 'Your account is protected with 2FA'
                    : 'Enable 2FA for enhanced security'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {twoFactorEnabled ? (
                <Badge variant="default" className="gap-1">
                  <Check className="h-3 w-3" />
                  Enabled
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <X className="h-3 w-3" />
                  Disabled
                </Badge>
              )}
              <Button
                variant={twoFactorEnabled ? 'destructive' : 'default'}
                onClick={() => {
                  if (twoFactorEnabled) {
                    // Need password to disable 2FA
                    setCurrentPassword('');
                    setShow2FADialog(true);
                    setTwoFactorStep('setup');
                  } else {
                    // Need password to enable 2FA
                    setCurrentPassword('');
                    setShow2FADialog(true);
                    setTwoFactorStep('setup');
                  }
                }}
              >
                {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
              </Button>
            </div>
          </div>

          {twoFactorEnabled && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Backup Codes</AlertTitle>
              <AlertDescription>
                Make sure you have saved your backup codes. You'll need them if
                you lose access to your authenticator.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Manage your active sessions across all devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.map((session: any) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {session.userAgent?.browser || 'Unknown Browser'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.ipAddress || 'Unknown IP'} • Last active{' '}
                        {format(new Date(session.updatedAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.id === session?.id && (
                      <Badge variant="secondary">Current</Badge>
                    )}
                    {session.id !== session?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={isRevokingSession === session.id}
                      >
                        {isRevokingSession === session.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <LogOut className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                className="w-full"
                onClick={handleRevokeAllSessions}
              >
                Revoke All Other Sessions
              </Button>
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              No active sessions found
            </p>
          )}
        </CardContent>
      </Card>

      {/* Linked Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Linked Accounts
          </CardTitle>
          <CardDescription>
            Connect your account with external providers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google Account */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium">Google</p>
                <p className="text-sm text-muted-foreground">
                  Sign in with Google account
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLinkAccount('google')}
              disabled={isLinkingAccount === 'google'}
            >
              {isLinkingAccount === 'google' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Connect'
              )}
            </Button>
          </div>

          {/* GitHub Account */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium">GitHub</p>
                <p className="text-sm text-muted-foreground">
                  Sign in with GitHub account
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLinkAccount('github')}
              disabled={isLinkingAccount === 'github'}
            >
              {isLinkingAccount === 'github' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Connect'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPasswordDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasswordChange}
              disabled={isChangingPassword}
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2FA Setup Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {twoFactorStep === 'setup' && 'Enable Two-Factor Authentication'}
              {twoFactorStep === 'verify' && 'Verify Your Authenticator'}
              {twoFactorStep === 'backup' && 'Save Your Backup Codes'}
            </DialogTitle>
          </DialogHeader>

          {twoFactorStep === 'setup' && (
            <>
              <DialogDescription>
                {twoFactorEnabled
                  ? 'Enter your password to disable 2FA'
                  : 'Enter your password to begin setting up 2FA'}
              </DialogDescription>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="2fa-password">Password</Label>
                  <Input
                    id="2fa-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShow2FADialog(false);
                    setCurrentPassword('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (twoFactorEnabled) {
                      handleDisable2FA();
                    } else {
                      handle2FASetup();
                    }
                  }}
                  disabled={is2FALoading || !currentPassword}
                >
                  {is2FALoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {twoFactorEnabled ? 'Disabling...' : 'Setting up...'}
                    </>
                  ) : twoFactorEnabled ? (
                    'Disable 2FA'
                  ) : (
                    'Continue'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}

          {twoFactorStep === 'verify' && (
            <>
              <DialogDescription>
                Scan the QR code with your authenticator app, then enter the
                code
              </DialogDescription>
              <div className="space-y-4">
                {totpUri && (
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <QRCodeSVG
                      value={totpUri}
                      size={200}
                      level="M"
                      marginSize={1}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="2fa-code">Verification Code</Label>
                  <Input
                    id="2fa-code"
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) =>
                      setVerificationCode(e.target.value.replace(/\D/g, ''))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setTwoFactorStep('setup')}
                >
                  Back
                </Button>
                <Button
                  onClick={handle2FAVerification}
                  disabled={is2FALoading || verificationCode.length !== 6}
                >
                  {is2FALoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Enable'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}

          {twoFactorStep === 'backup' && (
            <>
              <DialogDescription>
                Save these backup codes in a safe place. You can use them to
                access your account if you lose your authenticator.
              </DialogDescription>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="font-mono text-sm">
                      {code}
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={copyBackupCodes}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Backup Codes
                </Button>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setShow2FADialog(false);
                    setCurrentPassword('');
                    setVerificationCode('');
                    setTotpUri('');
                    // Refetch session to ensure we have latest data
                    setTimeout(() => refetchSession(), 100);
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
