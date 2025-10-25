'use client';

import { useAuthQuery } from '@/hooks/useConvexQuery';
import { api } from '@invoice-tracker/backend/convex/_generated/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Zap,
  Bot,
  HardDrive,
  Globe,
  Database,
  Mail,
  Settings,
  Info,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Clock,
  DollarSign,
  Shield,
} from 'lucide-react';

const metricIcons = {
  api_calls: Zap,
  ai_tokens: Bot,
  storage: HardDrive,
  bandwidth: Globe,
  database_operations: Database,
  email_sends: Mail,
  custom: Settings,
};

const metricLabels = {
  api_calls: 'API Calls',
  ai_tokens: 'AI Tokens',
  storage: 'Storage',
  bandwidth: 'Bandwidth',
  database_operations: 'Database Ops',
  email_sends: 'Email Sends',
  custom: 'Custom',
};

export function UsageRulesDisplay() {
  const rulesQuery = useAuthQuery(api.usageRules.getActiveRules);
  const currentUsageQuery = useAuthQuery(api.usageTracking.getCurrentUsage);

  if (rulesQuery.isPending || currentUsageQuery.isPending) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-muted rounded-lg" />
        <div className="h-32 bg-muted rounded-lg" />
      </div>
    );
  }

  const rules = rulesQuery.data || [];
  const currentUsage = currentUsageQuery.data || [];

  const groupedRules = rules.reduce(
    (acc, rule) => {
      if (!acc[rule.metricType]) {
        acc[rule.metricType] = [];
      }
      acc[rule.metricType].push(rule);
      return acc;
    },
    {} as Record<string, typeof rules>
  );

  const getUsageForRule = (rule: (typeof rules)[0]) => {
    return currentUsage.find(
      (u) => u.metricType === rule.metricType && u.currentPeriod === rule.limitPeriod
    );
  };

  const formatPeriod = (period: string) => {
    return period.charAt(0).toUpperCase() + period.slice(1);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Summary Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Usage Rules Overview</AlertTitle>
        <AlertDescription>
          These rules define the limits and pricing for your current
          subscription tier. Rules are applied in real-time to track and enforce
          usage limits.
        </AlertDescription>
      </Alert>

      {/* Rules by Metric Type */}
      <Tabs
        defaultValue={Object.keys(groupedRules)[0] || 'api_calls'}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full">
          {Object.entries(metricLabels).map(([key, label]) => {
            const Icon = metricIcons[key as keyof typeof metricIcons];
            const hasRules = groupedRules[key];
            return (
              <TabsTrigger
                key={key}
                value={key}
                className="gap-2"
                disabled={!hasRules}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
                {hasRules && (
                  <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                    {groupedRules[key].length}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(groupedRules).map(([metricType, metricRules]) => (
          <TabsContent
            key={metricType}
            value={metricType}
            className="space-y-4"
          >
            {metricRules.map((rule) => {
              const usage = getUsageForRule(rule);
              const usagePercent =
                usage && rule.limitValue ? (usage.consumed / rule.limitValue) * 100 : 0;
              const isOverLimit =
                usage && rule.limitValue && usage.consumed > rule.limitValue;
              const isNearLimit = usagePercent > 80 && !isOverLimit;

              return (
                <Card
                  key={rule._id}
                  className={isOverLimit ? 'border-destructive' : ''}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          {formatPeriod(rule.limitPeriod)} Limit
                        </CardTitle>
                        <Badge
                          variant={rule.isActive ? 'default' : 'secondary'}
                        >
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {rule.limitType && (
                          <Badge
                            variant={
                              rule.limitType === 'hard'
                                ? 'destructive'
                                : 'outline'
                            }
                          >
                            {rule.limitType === 'hard'
                              ? 'Hard Limit'
                              : 'Soft Limit'}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isOverLimit && (
                          <XCircle className="h-5 w-5 text-destructive" />
                        )}
                        {isNearLimit && (
                          <AlertCircle className="h-5 w-5 text-warning" />
                        )}
                        {!isOverLimit && !isNearLimit && usagePercent > 0 && (
                          <CheckCircle className="h-5 w-5 text-success" />
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      {rule.description ||
                        `${metricLabels[metricType as keyof typeof metricLabels]} usage limits`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Usage Progress */}
                    {rule.limitValue && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Current Usage</span>
                          <span className="font-medium">
                            {formatNumber(usage?.consumed || 0)} /{' '}
                            {formatNumber(rule.limitValue)}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(usagePercent, 100)}
                          className={isOverLimit ? 'bg-destructive/20' : ''}
                        />
                        {isNearLimit && (
                          <p className="text-xs text-warning">
                            You've used {Math.round(usagePercent)}% of your{' '}
                            {rule.limitPeriod} limit
                          </p>
                        )}
                        {isOverLimit && rule.limitType === 'soft' && (
                          <p className="text-xs text-destructive">
                            You've exceeded your limit. Overage charges may
                            apply.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Rule Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {rule.limitValue && (
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Limit</p>
                            <p className="font-medium">
                              {formatNumber(rule.limitValue)}
                            </p>
                          </div>
                        </div>
                      )}

                      {rule.overagePricePerUnit && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Overage Price</p>
                            <p className="font-medium">
                              ${rule.overagePricePerUnit} per unit
                            </p>
                          </div>
                        </div>
                      )}

                      {rule.includesCredits && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">
                              Included Credits
                            </p>
                            <p className="font-medium">
                              {formatNumber(rule.includesCredits)}
                            </p>
                          </div>
                        </div>
                      )}


                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Reset Period</p>
                          <p className="font-medium">
                            {formatPeriod(rule.limitPeriod)}
                          </p>
                        </div>
                      </div>

                      {rule.features && rule.features.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Feature</p>
                            <p className="font-medium">{rule.features.join(', ')}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tier Info */}
                    {rule.tierLevel && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Applies to tier:
                          </span>
                          <Badge variant="outline">{rule.tierLevel}</Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        ))}
      </Tabs>

      {rules.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No usage rules configured</p>
            <p className="text-sm text-muted-foreground mt-2">
              Rules will appear here once they're set up in the database
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
