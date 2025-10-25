'use client';

import { useState, useEffect } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Zap,
  Bot,
  HardDrive,
  Globe,
  Database,
  Mail,
  Settings,
  Activity,
  Clock,
  Filter,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const metricIcons = {
  api_calls: Zap,
  ai_tokens: Bot,
  storage: HardDrive,
  bandwidth: Globe,
  database_operations: Database,
  email_sends: Mail,
  custom: Settings,
};

const metricColors = {
  api_calls: 'text-yellow-500',
  ai_tokens: 'text-purple-500',
  storage: 'text-blue-500',
  bandwidth: 'text-green-500',
  database_operations: 'text-orange-500',
  email_sends: 'text-pink-500',
  custom: 'text-gray-500',
};

const statusIcons = {
  allowed: CheckCircle,
  blocked: XCircle,
  warning: AlertCircle,
  info: Info,
};

const statusColors = {
  allowed: 'text-success',
  blocked: 'text-destructive',
  warning: 'text-warning',
  info: 'text-muted-foreground',
};

export function UsageActivityFeed() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const eventsQuery = useAuthQuery(api.usageEvents.getRecentEvents, {
    limit: 100,
  });

  const events = eventsQuery.data || [];

  // Filter events
  const filteredEvents = events.filter((event) => {
    if (filter !== 'all' && event.metricType !== filter) return false;
    if (
      search &&
      !event.feature?.toLowerCase().includes(search.toLowerCase()) &&
      !event.metricType.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const formatTimestamp = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const getEventStatus = (
    event: (typeof events)[0]
  ): 'allowed' | 'blocked' | 'warning' | 'info' => {
    if (!event.allowed) return 'blocked';
    if (event.reason && event.reason.includes('warning')) return 'warning';
    return 'allowed';
  };

  const getEventMessage = (event: (typeof events)[0]) => {
    const amount = event.amount || 1;
    const metricLabel = event.metricType.replace(/_/g, ' ');

    if (!event.allowed) {
      return `${metricLabel} usage blocked - ${event.reason || 'limit exceeded'}`;
    }
    if (event.reason && event.reason.includes('warning')) {
      return `${metricLabel} usage warning - approaching limit`;
    }
    return `${amount} ${metricLabel} consumed`;
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="api_calls">API Calls</SelectItem>
            <SelectItem value="ai_tokens">AI Tokens</SelectItem>
            <SelectItem value="storage">Storage</SelectItem>
            <SelectItem value="bandwidth">Bandwidth</SelectItem>
            <SelectItem value="database_operations">Database</SelectItem>
            <SelectItem value="email_sends">Emails</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={autoRefresh ? 'default' : 'outline'}
          onClick={() => setAutoRefresh(!autoRefresh)}
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`}
          />
          {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
        </Button>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle>Real-time Activity</CardTitle>
            </div>
            <Badge variant="secondary">{filteredEvents.length} events</Badge>
          </div>
          <CardDescription>
            Live feed of usage events and operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            {filteredEvents.length > 0 ? (
              <div className="space-y-4">
                {filteredEvents.map((event) => {
                  const Icon =
                    metricIcons[event.metricType as keyof typeof metricIcons] ||
                    Activity;
                  const iconColor =
                    metricColors[
                      event.metricType as keyof typeof metricColors
                    ] || 'text-muted-foreground';
                  const status = getEventStatus(event);
                  const StatusIcon = statusIcons[status];
                  const statusColor = statusColors[status];

                  return (
                    <div
                      key={event._id}
                      className="flex items-start gap-3 pb-4 border-b last:border-0"
                    >
                      {/* Metric Icon */}
                      <div className={`mt-1 ${iconColor}`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">
                              {getEventMessage(event)}
                            </p>
                            {event.feature && (
                              <p className="text-xs text-muted-foreground">
                                Feature: {event.feature}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <StatusIcon className={`h-4 w-4 ${statusColor}`} />
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(event.timestamp)}
                            </span>
                          </div>
                        </div>

                        {/* Additional Info */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {event.creditsConsumed && (
                            <span className="flex items-center gap-1">
                              <TrendingDown className="h-3 w-3" />
                              {event.creditsConsumed} credits
                            </span>
                          )}
                          {event.appliedRuleId && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Rule: {event.appliedRuleId}
                            </span>
                          )}
                          {event.metadata &&
                            Object.keys(event.metadata).length > 0 && (
                              <span>
                                {Object.entries(event.metadata).map(
                                  ([key, value]) => (
                                    <span key={key} className="mr-2">
                                      {key}: {value as string}
                                    </span>
                                  )
                                )}
                              </span>
                            )}
                        </div>

                        {/* Warning/Error Messages */}
                        {!event.allowed && (
                          <div className="mt-2 p-2 bg-destructive/10 rounded-md">
                            <p className="text-xs text-destructive">
                              {event.reason || 'This operation was blocked due to usage limits'}
                            </p>
                          </div>
                        )}
                        {event.reason && event.reason.includes('warning') && (
                          <div className="mt-2 p-2 bg-warning/10 rounded-md">
                            <p className="text-xs text-warning">
                              Warning: Approaching usage limit for this metric
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mb-4" />
                <p>No activity events found</p>
                <p className="text-sm mt-2">
                  {filter !== 'all' || search
                    ? 'Try adjusting your filters'
                    : 'Events will appear here as they occur'}
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {filteredEvents.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold">{filteredEvents.length}</p>
                </div>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Allowed</p>
                  <p className="text-2xl font-bold text-success">
                    {
                      filteredEvents.filter((e) => e.allowed && !e.reason)
                        .length
                    }
                  </p>
                </div>
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Warnings</p>
                  <p className="text-2xl font-bold text-warning">
                    {filteredEvents.filter((e) => e.reason && e.reason.includes('warning')).length}
                  </p>
                </div>
                <AlertCircle className="h-4 w-4 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Blocked</p>
                  <p className="text-2xl font-bold text-destructive">
                    {filteredEvents.filter((e) => !e.allowed).length}
                  </p>
                </div>
                <XCircle className="h-4 w-4 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
