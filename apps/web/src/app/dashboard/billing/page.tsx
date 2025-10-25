'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Calendar,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Package,
  Settings,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { authClient } from '@/lib/auth-client';
import { useAuthQuery } from '@/hooks/useConvexQuery';
import { api } from '@invoice-tracker/backend/convex/_generated/api';
import { format } from 'date-fns';

export default function BillingPage() {
  const router = useRouter();
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  const { data: activeSubscription, isPending: isLoadingActiveSubscription } =
    useAuthQuery(api.subscriptions.getActiveSubscription, {});
  console.log('🚀 ~ BillingPage ~ activeSubscription:', activeSubscription);
  const { data: orders, isPending: isLoadingOrders } = useAuthQuery(
    api.subscriptions.listOrders,
    {
      limit: 5,
    }
  );
  const { data: meters, isPending: isLoadingMeters } = useAuthQuery(
    api.subscriptions.getUsageMeters,
    {}
  );

  const handleOpenPortal = async () => {
    setLoadingPortal(true);
    try {
      await authClient.customer.portal();
    } catch (error) {
      console.error('Error opening portal:', error);
    } finally {
      setLoadingPortal(false);
    }
  };

  const handleUpgrade = async () => {
    setLoadingCheckout(true);
    try {
      // Navigate to pricing page for upgrade
      router.push('/pricing');
    } finally {
      setLoadingCheckout(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: {
        variant: 'default' as const,
        icon: CheckCircle,
        label: 'Active',
      },
      trialing: { variant: 'secondary' as const, icon: Clock, label: 'Trial' },
      canceled: {
        variant: 'destructive' as const,
        icon: AlertCircle,
        label: 'Canceled',
      },
      past_due: {
        variant: 'destructive' as const,
        icon: AlertCircle,
        label: 'Past Due',
      },
    };

    const config = variants[status] || variants.active;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const isLifetimeSubscription = activeSubscription?.isLifetime || false;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing details
          </p>
        </div>
        <Button
          onClick={handleOpenPortal}
          disabled={loadingPortal}
          variant="outline"
        >
          <Settings className="h-4 w-4 mr-2" />
          {loadingPortal ? 'Opening...' : 'Manage Billing'}
        </Button>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Your active subscription and billing cycle
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingActiveSubscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-32" />
                </div>
              </div>
            </div>
          ) : activeSubscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isLifetimeSubscription ? (
                    <Crown className="h-8 w-8 text-yellow-500" />
                  ) : (
                    <Package className="h-8 w-8 text-primary" />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">
                      {activeSubscription.productName || 'Pro Plan'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isLifetimeSubscription
                        ? 'Lifetime access - No expiration'
                        : activeSubscription.cancelAtPeriodEnd
                          ? 'Cancels at period end'
                          : 'Auto-renews'}
                    </p>
                  </div>
                </div>
                {isLifetimeSubscription ? (
                  <Badge className="bg-yellow-500 text-white">Lifetime</Badge>
                ) : (
                  getStatusBadge(activeSubscription.status)
                )}
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-3">
                {isLifetimeSubscription ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Purchase Date
                      </p>
                      <p className="font-medium">
                        {format(
                          activeSubscription.currentPeriodStart,
                          'MMM d, yyyy'
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Access Type
                      </p>
                      <p className="font-medium">Lifetime Access</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-medium text-green-600">
                        Active Forever
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Billing Cycle
                      </p>
                      <p className="font-medium">
                        {format(
                          activeSubscription.currentPeriodStart,
                          'MMM d, yyyy'
                        )}{' '}
                        -{' '}
                        {format(
                          activeSubscription.currentPeriodEnd,
                          'MMM d, yyyy'
                        )}
                      </p>
                    </div>
                    {(activeSubscription as any).trialEnd && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Trial Ends
                        </p>
                        <p className="font-medium">
                          {format(
                            (activeSubscription as any).trialEnd,
                            'MMM d, yyyy'
                          )}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Next Payment
                      </p>
                      <p className="font-medium">
                        {activeSubscription.cancelAtPeriodEnd
                          ? 'No upcoming payment'
                          : format(
                              activeSubscription.currentPeriodEnd,
                              'MMM d, yyyy'
                            )}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {activeSubscription.cancelAtPeriodEnd &&
                !isLifetimeSubscription && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Subscription Ending</AlertTitle>
                    <AlertDescription>
                      Your subscription will end on{' '}
                      {format(
                        activeSubscription.currentPeriodEnd,
                        'MMMM d, yyyy'
                      )}
                      . You can reactivate anytime before this date.
                    </AlertDescription>
                  </Alert>
                )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">No Active Subscription</h3>
              <p className="text-muted-foreground mb-4">
                You're currently on the free plan
              </p>
              <Button onClick={handleUpgrade} disabled={loadingCheckout}>
                {loadingCheckout ? 'Loading...' : 'Upgrade to Pro'}
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {activeSubscription && !isLifetimeSubscription ? (
            <Button variant="outline" onClick={handleOpenPortal}>
              <CreditCard className="h-4 w-4 mr-2" />
              Update Payment Method
            </Button>
          ) : (
            <div />
          )}
          <Button variant="outline" onClick={() => router.push('/pricing')}>
            <TrendingUp className="h-4 w-4 mr-2" />
            View Plans
          </Button>
        </CardFooter>
      </Card>

      {/* Usage Meters */}
      {!isLoadingMeters && meters && meters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Usage This Period</CardTitle>
            <CardDescription>
              Your current usage across different metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {meters.map((meter) => {
              const percentage = meter.limit
                ? (meter.consumed / meter.limit) * 100
                : 0;

              return (
                <div key={meter._id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {meter.meterName}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {meter.consumed} / {meter.limit || '∞'}
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Your recent payments and invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingOrders ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32 flex-1" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : orders && orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell>
                      {format(order.createdAt, 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{order.productName}</TableCell>
                    <TableCell>{formatCurrency(order.amount)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === 'completed'
                            ? 'default'
                            : order.status === 'refunded'
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No billing history yet</p>
            </div>
          )}
        </CardContent>
        {!isLoadingOrders && orders && orders.length > 0 && (
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleOpenPortal}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View All Transactions
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
