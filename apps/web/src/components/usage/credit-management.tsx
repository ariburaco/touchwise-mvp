'use client';

import { useState } from 'react';
import { useAuthMutation, useAuthQuery } from '@/hooks/useConvexQuery';
import { api } from '@invoice-tracker/backend/convex/_generated/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  CreditCard,
  Plus,
  Minus,
  ArrowRight,
  History,
  TrendingUp,
  Clock,
  Calendar,
  Info,
  DollarSign,
  Zap,
  Gift,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export function CreditManagement() {
  const [isLoading, setIsLoading] = useState(false);
  const [allocateAmount, setAllocateAmount] = useState(100);
  const [transferAmount, setTransferAmount] = useState(50);
  const [transferTo, setTransferTo] = useState('');
  const [consumeAmount, setConsumeAmount] = useState(10);
  const [consumeMetric, setConsumeMetric] = useState('api_calls');

  // Queries
  const creditsQuery = useAuthQuery(api.usageCredits.getUserCredits);
  const creditHistoryQuery = useAuthQuery(api.usageCredits.getCreditHistory, {
    limit: 10,
  });

  // Mutations
  const allocateCreditsMutation = useAuthMutation(
    api.usageTests.allocateTestCredits
  );
  const consumeCreditsMutation = useAuthMutation(
    api.usageTests.consumeTestCredits
  );
  const transferCreditsMutation = useAuthMutation(
    api.usageTests.transferTestCredits
  );

  const credits = creditsQuery.data || [];
  const history = creditHistoryQuery.data || [];

  const totalCredits = credits.reduce(
    (sum, c) => sum + c.availableCredits + c.usedCredits,
    0
  );
  const allocatedCredits = credits.reduce(
    (sum, c) => sum + (c.reservedCredits || 0),
    0
  );
  const availableCredits = totalCredits - allocatedCredits;

  const handleAllocateCredits = async () => {
    if (!allocateCreditsMutation) {
      toast.error('Credit allocation not yet implemented');
      return;
    }

    setIsLoading(true);
    try {
      await allocateCreditsMutation.mutate({
        amount: allocateAmount,
        expiresInDays: 30,
      });
      toast.success(`Successfully allocated ${allocateAmount} credits`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to allocate credits');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsumeCredits = async () => {
    if (!consumeCreditsMutation) {
      toast.error('Credit consumption not yet implemented');
      return;
    }

    setIsLoading(true);
    try {
      await consumeCreditsMutation.mutate({
        amount: consumeAmount,
        metricType: consumeMetric,
      });
      toast.success(`Successfully consumed ${consumeAmount} credits`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to consume credits');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferCredits = async () => {
    if (!transferCreditsMutation || !transferTo) {
      toast.error('Please enter a recipient user ID');
      return;
    }

    setIsLoading(true);
    try {
      await transferCreditsMutation.mutate({
        amount: transferAmount,
        toUserId: transferTo,
      });
      toast.success(`Successfully transferred ${transferAmount} credits`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to transfer credits');
    } finally {
      setIsLoading(false);
    }
  };

  const formatExpiry = (expiryDate: number | null) => {
    if (!expiryDate) return 'Never';
    const now = Date.now();
    if (expiryDate < now) return 'Expired';
    return formatDistanceToNow(new Date(expiryDate), { addSuffix: true });
  };

  return (
    <div className="space-y-6">
      {/* Credit Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCredits.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Lifetime balance across all allocations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Credits
            </CardTitle>
            <Zap className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {availableCredits.toLocaleString()}
            </div>
            <Progress
              value={(availableCredits / Math.max(totalCredits, 1)) * 100}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Allocated Credits
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {allocatedCredits.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Reserved for specific operations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="allocate" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="allocate">Allocate</TabsTrigger>
          <TabsTrigger value="consume">Consume</TabsTrigger>
          <TabsTrigger value="transfer">Transfer</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Allocate Tab */}
        <TabsContent value="allocate">
          <Card>
            <CardHeader>
              <CardTitle>Allocate Credits</CardTitle>
              <CardDescription>
                Add new credits to your account for testing purposes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Test Mode</AlertTitle>
                <AlertDescription>
                  In production, credits would be purchased or earned. This is
                  for testing only.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="allocate-amount">Credit Amount</Label>
                <div className="flex gap-2">
                  <Input
                    id="allocate-amount"
                    type="number"
                    value={allocateAmount}
                    onChange={(e) => setAllocateAmount(Number(e.target.value))}
                    min={1}
                    max={10000}
                  />
                  <Button
                    onClick={handleAllocateCredits}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Allocate Credits
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[100, 500, 1000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => setAllocateAmount(amount)}
                    className="w-full"
                  >
                    {amount} credits
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consume Tab */}
        <TabsContent value="consume">
          <Card>
            <CardHeader>
              <CardTitle>Consume Credits</CardTitle>
              <CardDescription>
                Test credit consumption for different metric types
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="consume-amount">Amount to Consume</Label>
                  <Input
                    id="consume-amount"
                    type="number"
                    value={consumeAmount}
                    onChange={(e) => setConsumeAmount(Number(e.target.value))}
                    min={1}
                    max={availableCredits}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consume-metric">Metric Type</Label>
                  <Select
                    value={consumeMetric}
                    onValueChange={setConsumeMetric}
                  >
                    <SelectTrigger id="consume-metric">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="api_calls">API Calls</SelectItem>
                      <SelectItem value="ai_tokens">AI Tokens</SelectItem>
                      <SelectItem value="storage">Storage</SelectItem>
                      <SelectItem value="bandwidth">Bandwidth</SelectItem>
                      <SelectItem value="email_sends">Email Sends</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleConsumeCredits}
                disabled={isLoading || consumeAmount > availableCredits}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Minus className="h-4 w-4" />
                )}
                Consume {consumeAmount} Credits
              </Button>

              {consumeAmount > availableCredits && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Insufficient credits. You have {availableCredits} available.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transfer Tab */}
        <TabsContent value="transfer">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Credits</CardTitle>
              <CardDescription>
                Send credits to another user (test mode)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transfer-to">Recipient User ID</Label>
                <Input
                  id="transfer-to"
                  placeholder="Enter user ID..."
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transfer-amount">Amount to Transfer</Label>
                <Input
                  id="transfer-amount"
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Number(e.target.value))}
                  min={1}
                  max={availableCredits}
                />
              </div>

              <Button
                onClick={handleTransferCredits}
                disabled={
                  isLoading || !transferTo || transferAmount > availableCredits
                }
                className="w-full gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                Transfer Credits
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Credit History</CardTitle>
              <CardDescription>
                Recent credit transactions and allocations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="space-y-4">
                  {history.map((entry) => (
                    <div
                      key={entry._id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {entry.type === 'allocation' && (
                          <Plus className="h-4 w-4 text-success" />
                        )}
                        {entry.type === 'consumption' && (
                          <Minus className="h-4 w-4 text-destructive" />
                        )}
                        {entry.type === 'transfer' && (
                          <ArrowRight className="h-4 w-4 text-blue-500" />
                        )}
                        {entry.type === 'rollover' && (
                          <RefreshCw className="h-4 w-4 text-purple-500" />
                        )}

                        <div>
                          <p className="font-medium">
                            {entry.type.charAt(0).toUpperCase() +
                              entry.type.slice(1)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(entry._creationTime),
                              { addSuffix: true }
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className={`font-bold ${
                            entry.type === 'allocation'
                              ? 'text-success'
                              : entry.type === 'consumption'
                                ? 'text-destructive'
                                : ''
                          }`}
                        >
                          {entry.type === 'allocation' ||
                          entry.type === 'rollover'
                            ? '+'
                            : '-'}
                          {entry.amount}
                        </p>
                        {entry.metricType && (
                          <p className="text-xs text-muted-foreground">
                            {entry.metricType}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4" />
                  <p>No credit history yet</p>
                  <p className="text-sm mt-2">
                    Allocate some credits to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Credit Allocations List */}
      {credits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Credit Allocations</CardTitle>
            <CardDescription>
              Your current credit allocations and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {credits.map((credit) => (
                <div
                  key={credit._id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        Balance: {credit.availableCredits + credit.usedCredits}
                      </span>
                      {(credit.reservedCredits || 0) > 0 && (
                        <Badge variant="secondary">
                          {credit.reservedCredits} reserved
                        </Badge>
                      )}
                      {credit.creditType && (
                        <Badge variant="outline">{credit.creditType}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Created: {format(new Date(credit._creationTime), 'PP')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Expires: {formatExpiry(credit.expiresAt || null)}
                      </span>
                    </div>
                  </div>
                  {credit.canRollover && (
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
