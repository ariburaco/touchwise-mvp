'use client';

import { useState } from 'react';
import { UsageDashboard } from '@/components/usage-dashboard';
import { UsageTestPanel } from '@/components/usage/usage-test-panel';
import { UsageRulesDisplay } from '@/components/usage/usage-rules-display';
import { UsageActivityFeed } from '@/components/usage/usage-activity-feed';
import { CreditManagement } from '@/components/usage/credit-management';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { InfoIcon, TestTube, Activity, CreditCard, Shield, BarChart } from 'lucide-react';

export default function UsagePage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usage Metrics & Testing</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your usage, test features, and manage credits
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <TestTube className="h-3 w-3" />
          Development Mode
        </Badge>
      </div>

      {/* Info Alert */}
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Testing Environment</AlertTitle>
        <AlertDescription>
          This page allows you to test the usage tracking system. All operations here are safe and 
          won't affect production data. Use the test panel to simulate different usage scenarios.
        </AlertDescription>
      </Alert>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full max-w-[600px]">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="testing" className="gap-2">
            <TestTube className="h-4 w-4" />
            Testing
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <Shield className="h-4 w-4" />
            Rules
          </TabsTrigger>
          <TabsTrigger value="credits" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Credits
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <UsageDashboard />
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage Testing Panel</CardTitle>
              <CardDescription>
                Test different usage scenarios and see how the system responds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsageTestPanel />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage Rules Configuration</CardTitle>
              <CardDescription>
                View and understand the current usage rules for your tier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsageRulesDisplay />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credits Tab */}
        <TabsContent value="credits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Credit Management</CardTitle>
              <CardDescription>
                Manage and test credit allocation, consumption, and transfers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreditManagement />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage Activity Feed</CardTitle>
              <CardDescription>
                Real-time view of all usage events and operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsageActivityFeed />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}