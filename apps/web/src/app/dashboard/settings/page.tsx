'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  User,
  Bell,
  Palette,
  Globe,
  Smartphone,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  Loader2,
} from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { SupportedLanguage } from '@invoice-tracker/translations';

export default function SettingsPage() {
  const { settings, isLoading, updateSettings } = useSettings();

  const handleThemeChange = async (value: string) => {
    await updateSettings({ theme: value as 'light' | 'dark' | 'system' });
  };

  const handleLanguageChange = async (value: string) => {
    await updateSettings({ language: value as SupportedLanguage });
  };

  const handleNotificationChange = async (value: boolean) => {
    await updateSettings({ emailNotifications: value });
  };

  // Show loading state while fetching settings
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application preferences and account settings
        </p>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/profile">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/settings/security">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <CardDescription>Password, 2FA, and sessions</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/billing">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Billing
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <CardDescription>
                Manage subscription and payments
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme" className="flex flex-col space-y-1">
              <span>Theme</span>
              <span className="text-sm font-normal text-muted-foreground">
                Select your preferred theme
              </span>
            </Label>
            <Select
              value={settings?.theme || 'system'}
              onValueChange={handleThemeChange}
              disabled={isLoading}
            >
              <SelectTrigger id="theme" className="w-40">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Dark
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    System
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="email-notifications"
              className="flex flex-col space-y-1"
            >
              <span>Email Notifications</span>
              <span className="text-sm font-normal text-muted-foreground">
                Receive notifications via email
              </span>
            </Label>
            <Switch
              id="email-notifications"
              checked={settings?.emailNotifications}
              onCheckedChange={handleNotificationChange}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Language & Region */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Language & Region
          </CardTitle>
          <CardDescription>
            Set your language and regional preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="language" className="flex flex-col space-y-1">
              <span>Language</span>
              <span className="text-sm font-normal text-muted-foreground">
                Select your preferred language
              </span>
            </Label>
            <Select
              value={settings?.language}
              onValueChange={handleLanguageChange}
              disabled={isLoading}
            >
              <SelectTrigger id="language" className="w-40">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="tr">Türkçe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="timezone" className="flex flex-col space-y-1">
              <span>Timezone</span>
              <span className="text-sm font-normal text-muted-foreground">
                Your current timezone
              </span>
            </Label>
            <div className="text-sm text-muted-foreground">
              {settings?.timezone ||
                Intl.DateTimeFormat().resolvedOptions().timeZone}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Display Preferences</CardTitle>
          <CardDescription>Customize your viewing experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="date-format" className="flex flex-col space-y-1">
              <span>Date Format</span>
              <span className="text-sm font-normal text-muted-foreground">
                How dates are displayed throughout the app
              </span>
            </Label>
            <Select
              value={settings?.dateFormat || 'MM/DD/YYYY'}
              onValueChange={(value) => updateSettings({ dateFormat: value })}
              disabled={isLoading}
            >
              <SelectTrigger id="date-format" className="w-40">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="default-view" className="flex flex-col space-y-1">
              <span>Default View</span>
              <span className="text-sm font-normal text-muted-foreground">
                How data is displayed by default
              </span>
            </Label>
            <Select
              value={settings?.defaultView || 'grid'}
              onValueChange={(value) =>
                updateSettings({ defaultView: value as 'grid' | 'table' })
              }
              disabled={isLoading}
            >
              <SelectTrigger id="default-view" className="w-40">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="table">Table</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="table-size" className="flex flex-col space-y-1">
              <span>Table Page Size</span>
              <span className="text-sm font-normal text-muted-foreground">
                Number of rows per page in tables
              </span>
            </Label>
            <Select
              value={String(settings?.tablePageSize)}
              onValueChange={(value) =>
                updateSettings({ tablePageSize: parseInt(value) })
              }
              disabled={isLoading}
            >
              <SelectTrigger id="table-size" className="w-40">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label
              htmlFor="sidebar-collapsed"
              className="flex flex-col space-y-1"
            >
              <span>Sidebar Collapsed</span>
              <span className="text-sm font-normal text-muted-foreground">
                Start with sidebar collapsed by default
              </span>
            </Label>
            <Switch
              id="sidebar-collapsed"
              checked={settings?.sidebarCollapsed || false}
              onCheckedChange={(value) =>
                updateSettings({ sidebarCollapsed: value })
              }
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Settings</CardTitle>
          <CardDescription>Additional configuration options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start" disabled>
            Export Account Data
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            Clear Cache
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700"
            disabled
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
