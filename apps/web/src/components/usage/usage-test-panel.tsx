'use client';

import { useState } from 'react';
import { useAuthMutation } from '@/hooks/useConvexQuery';
import { api } from '@invoice-tracker/backend/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  Zap, 
  Bot, 
  Upload, 
  Mail, 
  Database,
  Play,
  AlertCircle,
  CheckCircle,
  Loader2,
  Sparkles,
  Info,
  RefreshCcw
} from 'lucide-react';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

export function UsageTestPanel() {
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Test parameters
  const [apiCallCount, setApiCallCount] = useState(1);
  const [aiTokenCount, setAiTokenCount] = useState(100);
  const [fileSize, setFileSize] = useState(1); // MB
  const [emailCount, setEmailCount] = useState(1);
  const [batchSize, setBatchSize] = useState(5);
  const [selectedTier, setSelectedTier] = useState<'free' | 'pro' | 'team' | 'enterprise'>('free');

  const testApiCallsMutation = useAuthMutation(api.usageTests.testApiCalls);
  const testAiTokensMutation = useAuthMutation(api.usageTests.testAiTokens);
  const testStorageMutation = useAuthMutation(api.usageTests.testStorage);
  const testEmailsMutation = useAuthMutation(api.usageTests.testEmails);
  const testBatchMutation = useAuthMutation(api.usageTests.testBatchProcess);
  const seedTestRulesMutation = useAuthMutation(api.testSeedRules.seedTestRules);
  const clearTestRulesMutation = useAuthMutation(api.testSeedRules.clearTestRules);
  const syncTrackingMutation = useAuthMutation(api.testSeedRules.syncTrackingWithRules);

  const runTest = async (
    testName: string,
    testFunction: () => Promise<any>
  ) => {
    setIsLoading(true);
    setTestResults(null);

    try {
      const result = await testFunction();
      
      // Check if any operations were blocked
      const hasBlocked = result.summary?.blocked > 0 || 
                        result.results?.some((r: any) => !r.allowed) ||
                        !result.result?.allowed;
      
      // Check if any operations had warnings
      const hasWarnings = result.summary?.warnings > 0 || 
                         result.results?.some((r: any) => r.warning);
      
      if (hasBlocked) {
        setTestResults({
          success: false,
          message: `${testName} - Some operations were blocked due to limits`,
          details: result
        });
        toast.error(`${testName} - ${result.summary?.blocked || 1} operations blocked`);
      } else if (hasWarnings) {
        setTestResults({
          success: true,
          message: `${testName} completed with warnings`,
          details: result
        });
        toast(`${testName} - Approaching usage limits`, {
          icon: '⚠️',
          className: 'text-yellow-600'
        });
      } else {
        setTestResults({
          success: true,
          message: `${testName} completed successfully!`,
          details: result
        });
        toast.success(`${testName} completed successfully!`);
      }
    } catch (error: any) {
      setTestResults({
        success: false,
        message: error.message || `${testName} failed`,
        details: error
      });
      toast.error(error.message || `${testName} failed`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedRules = async () => {
    setIsLoading(true);
    try {
      await seedTestRulesMutation.mutate({ tier: selectedTier, clearFirst: true });
      toast.success(`Seeded test rules for ${selectedTier} tier!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to seed rules');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSyncTracking = async () => {
    setIsLoading(true);
    try {
      const result = await syncTrackingMutation.mutate({});
      toast.success(result.message || 'Synchronized tracking with rules');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sync tracking');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearRules = async () => {
    setIsLoading(true);
    try {
      await clearTestRulesMutation.mutate({});
      toast.success('Cleared all test rules!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to clear rules');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Rule Seeding Section */}
      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h3 className="font-semibold">Setup Test Rules</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Select Tier</Label>
            <Select value={selectedTier} onValueChange={(value: any) => setSelectedTier(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free Tier</SelectItem>
                <SelectItem value="pro">Pro Tier</SelectItem>
                <SelectItem value="team">Team Tier</SelectItem>
                <SelectItem value="enterprise">Enterprise Tier</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSeedRules}
            disabled={isLoading}
            className="gap-2 self-end"
            variant="default"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Seed Rules
          </Button>
          
          <Button
            onClick={handleSyncTracking}
            disabled={isLoading}
            className="gap-2 self-end"
            variant="outline"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Sync Tracking
          </Button>

          <Button
            onClick={handleClearRules}
            disabled={isLoading}
            className="gap-2 self-end"
            variant="destructive"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertCircle className="h-4 w-4" />}
            Clear All
          </Button>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Seed test rules to see how the usage system works with different subscription tiers.
            This will create sample usage rules that you can test against.
          </AlertDescription>
        </Alert>
      </div>

      {/* API Calls Test */}
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold">API Calls Test</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Number of API Calls</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[apiCallCount]}
                onValueChange={([value]) => setApiCallCount(value)}
                min={1}
                max={100}
                step={1}
                className="flex-1"
              />
              <Input
                type="number"
                value={apiCallCount}
                onChange={(e) => setApiCallCount(Number(e.target.value))}
                className="w-20"
                min={1}
                max={100}
              />
            </div>
          </div>
        </div>

        <Button
          onClick={() => runTest('API Calls Test', () => 
            testApiCallsMutation.mutate({ count: apiCallCount })
          )}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run API Test
        </Button>
      </div>

      {/* AI Tokens Test */}
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-purple-500" />
          <h3 className="font-semibold">AI Tokens Test</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Number of Tokens</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[aiTokenCount]}
                onValueChange={([value]) => setAiTokenCount(value)}
                min={10}
                max={10000}
                step={10}
                className="flex-1"
              />
              <Input
                type="number"
                value={aiTokenCount}
                onChange={(e) => setAiTokenCount(Number(e.target.value))}
                className="w-24"
                min={10}
                max={10000}
              />
            </div>
          </div>
        </div>

        <Button
          onClick={() => runTest('AI Tokens Test', () => 
            testAiTokensMutation.mutate({ tokens: aiTokenCount })
          )}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run AI Test
        </Button>
      </div>

      {/* Storage Test */}
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold">Storage Test</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>File Size (MB)</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[fileSize]}
                onValueChange={([value]) => setFileSize(value)}
                min={1}
                max={100}
                step={1}
                className="flex-1"
              />
              <Input
                type="number"
                value={fileSize}
                onChange={(e) => setFileSize(Number(e.target.value))}
                className="w-20"
                min={1}
                max={100}
              />
            </div>
          </div>
        </div>

        <Button
          onClick={() => runTest('Storage Test', () => 
            testStorageMutation.mutate({ sizeMB: fileSize })
          )}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run Storage Test
        </Button>
      </div>

      {/* Email Test */}
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-green-500" />
          <h3 className="font-semibold">Email Sending Test</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Number of Emails</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[emailCount]}
                onValueChange={([value]) => setEmailCount(value)}
                min={1}
                max={50}
                step={1}
                className="flex-1"
              />
              <Input
                type="number"
                value={emailCount}
                onChange={(e) => setEmailCount(Number(e.target.value))}
                className="w-20"
                min={1}
                max={50}
              />
            </div>
          </div>
        </div>

        <Button
          onClick={() => runTest('Email Test', () => 
            testEmailsMutation.mutate({ count: emailCount })
          )}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run Email Test
        </Button>
      </div>

      {/* Batch Processing Test */}
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-orange-500" />
          <h3 className="font-semibold">Batch Processing Test</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Batch Size</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[batchSize]}
                onValueChange={([value]) => setBatchSize(value)}
                min={1}
                max={20}
                step={1}
                className="flex-1"
              />
              <Input
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="w-20"
                min={1}
                max={20}
              />
            </div>
          </div>
        </div>

        <Button
          onClick={() => runTest('Batch Processing Test', () => 
            testBatchMutation.mutate({ batchSize })
          )}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run Batch Test
        </Button>
      </div>

      {/* Test Results */}
      {testResults && (
        <Alert className={testResults.success ? 'border-green-500' : 'border-red-500'}>
          {testResults.success ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          <AlertDescription>
            <div className="font-semibold mb-1">{testResults.message}</div>
            {testResults.details && (
              <>
                {/* Summary if available */}
                {testResults.details.summary && (
                  <div className="mt-2 p-2 bg-muted rounded space-y-1 text-xs">
                    <div>Total: {testResults.details.summary.total} operations</div>
                    {testResults.details.summary.allowed !== undefined && (
                      <div className="text-green-600">Allowed: {testResults.details.summary.allowed}</div>
                    )}
                    {testResults.details.summary.blocked > 0 && (
                      <div className="text-red-600">Blocked: {testResults.details.summary.blocked}</div>
                    )}
                    {testResults.details.summary.warnings > 0 && (
                      <div className="text-yellow-600">Warnings: {testResults.details.summary.warnings}</div>
                    )}
                  </div>
                )}
                {/* Detailed results */}
                <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-x-auto">
                  {JSON.stringify(testResults.details, null, 2)}
                </pre>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}