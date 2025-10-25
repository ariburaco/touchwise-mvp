'use client';

import React from 'react';
import { useAuthQuery } from '@/hooks/useConvexQuery';
import { api } from '@invoice-tracker/backend/convex/_generated/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Activity,
  AlertCircle,
  Clock,
  Coins,
  Info,
  TrendingUp,
  Zap,
  Database,
  Wifi,
  Bot,
} from 'lucide-react';

// Metric type icons
const metricIcons: Record<string, React.ReactNode> = {
  api_calls: <Zap className="h-4 w-4" />,
  ai_tokens: <Bot className="h-4 w-4" />,
  storage: <Database className="h-4 w-4" />,
  bandwidth: <Wifi className="h-4 w-4" />,
};

// Status badge variants
const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  normal: 'default',
  warning: 'secondary',
  exceeded: 'destructive',
  blocked: 'destructive',
  grace: 'outline',
};

export function UsageDashboard() {
  const usageQuery = useAuthQuery(api.usage.getUserUsage, {});
  const statsQuery = useAuthQuery(api.usage.getUsageStats, { period: 'month' });

  if (usageQuery.isPending || statsQuery.isPending) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (usageQuery.error || statsQuery.error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load usage data. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  const usage = usageQuery.data;
  const stats = statsQuery.data;

  if (!usage || !stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Warnings */}
      {usage.warnings.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Usage Alerts</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1">
              {usage.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Usage Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Current Usage</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {usage.metrics.map((metric) => (
            <Card key={metric.type}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {metricIcons[metric.type] || <Activity className="h-4 w-4" />}
                    <CardTitle className="text-sm font-medium">
                      {metric.type.replace(/_/g, ' ').toUpperCase()}
                    </CardTitle>
                  </div>
                  <Badge variant={statusVariants[metric.status] || 'default'}>
                    {metric.status}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  {metric.period} limit
                  {metric.appliedRuleId && (
                    <span className="text-muted-foreground/70"> • Rule: {metric.appliedRuleId}</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Progress 
                    value={metric.percentUsed} 
                    className={metric.percentUsed >= 90 ? 'bg-red-100' : metric.percentUsed >= 75 ? 'bg-yellow-100' : ''}
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {metric.used.toLocaleString()} / {metric.limit.toLocaleString()}
                    </span>
                    <span className="font-medium">
                      {metric.percentUsed.toFixed(0)}%
                    </span>
                  </div>
                  {metric.remaining > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {metric.remaining.toLocaleString()} remaining
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Credits */}
      {usage.credits.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Available Credits</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {usage.credits.map((credit) => (
              <Card key={credit.type}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4" />
                      <CardTitle className="text-sm font-medium">
                        {credit.type.replace(/_/g, ' ').toUpperCase()}
                      </CardTitle>
                    </div>
                    <Badge variant="outline">{credit.source}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      {credit.available.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {credit.used.toLocaleString()} used of {credit.total.toLocaleString()}
                    </div>
                    {credit.expiresAt && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Expires {new Date(credit.expiresAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Usage Statistics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Usage Statistics (Last 30 Days)</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {stats.metrics.map((stat) => (
            <Card key={stat.metricType}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {stat.metricType.replace(/_/g, ' ').toUpperCase()}
                  </CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <p>Total Events: {stat.count}</p>
                          <p>Success Rate: {stat.successRate.toFixed(1)}%</p>
                          {stat.cost > 0 && <p>Total Cost: ${stat.cost.toFixed(2)}</p>}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Usage</p>
                    <p className="text-xl font-bold">{stat.total.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Daily Average</p>
                    <p className="text-xl font-bold">{stat.dailyAverage.toLocaleString()}</p>
                  </div>
                </div>
                {stat.blockedCount > 0 && (
                  <Alert className="mt-4" variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {stat.blockedCount} requests were blocked due to limit exceeded
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Total Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Events</p>
              <p className="text-xl font-bold">{stats.totalEvents.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Credits</p>
              <p className="text-xl font-bold">{usage.totalCredits.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Metrics</p>
              <p className="text-xl font-bold">{usage.metrics.length}</p>
            </div>
            {stats.totalCost > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-xl font-bold">${stats.totalCost.toFixed(2)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}