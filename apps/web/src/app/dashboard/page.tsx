'use client';

import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Settings,
  Shield,
  CreditCard,
  User,
  LogOut,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { session } = useAuth();
  const router = useRouter();
  
  const getUserInitials = (name: string | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push('/auth/login');
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {session?.user?.name || session?.user?.email || 'User'}!
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={session?.user?.image || undefined} />
            <AvatarFallback>{getUserInitials(session?.user?.name)}</AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium">{session?.user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/profile">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Account</div>
              <p className="text-xs text-muted-foreground">
                Manage your profile information
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/settings/security">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Settings</div>
              <p className="text-xs text-muted-foreground">
                Password & 2FA settings
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/billing">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Billing</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Subscription</div>
              <p className="text-xs text-muted-foreground">
                Manage your subscription
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/settings">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Settings</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Preferences</div>
              <p className="text-xs text-muted-foreground">
                App settings & preferences
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Account Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Email</span>
                <span className="text-sm text-muted-foreground">{session?.user?.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Name</span>
                <span className="text-sm text-muted-foreground">{session?.user?.name || 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Email Verified</span>
                <span className="text-sm text-muted-foreground">
                  {session?.user?.emailVerified ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">2FA Status</span>
                <span className="text-sm text-muted-foreground">
                  {(session?.user as any)?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            <div className="pt-4">
              <Link href="/dashboard/profile">
                <Button variant="outline" className="w-full">
                  <User className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/settings/security">
              <Button variant="outline" className="w-full justify-start">
                <Shield className="mr-2 h-4 w-4" />
                Security Settings
              </Button>
            </Link>
            <Link href="/dashboard/billing">
              <Button variant="outline" className="w-full justify-start">
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Subscription
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" />
                App Settings
              </Button>
            </Link>
            <Link href="/support">
              <Button variant="outline" className="w-full justify-start">
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="w-full justify-start text-red-600 hover:text-red-700"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}