'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, MessageSquare, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useAuthQuery, useAuthMutation } from '@/hooks/useConvexQuery';
import { api } from '@invoice-tracker/backend/convex/_generated/api';

export default function DashboardPage() {
  const { session } = useAuth();
  const [initialized, setInitialized] = useState(false);

  const { mutate: getOrCreateCompany } = useAuthMutation(api.companies.getOrCreateDefault);
  const { data: leads } = useAuthQuery(api.leads.list, {});
  const { data: chatLinks } = useAuthQuery(api.chatLinks.list, {});

  const [company, setCompany] = useState<any>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);

  useEffect(() => {
    if (!initialized && session) {
      getOrCreateCompany({})
        .then((result) => {
          setCompany(result);
          setLoadingCompany(false);
          setInitialized(true);
        })
        .catch((error) => {
          setLoadingCompany(false);
        });
    }
  }, [initialized, session, getOrCreateCompany]);

  const totalLeads = leads?.length || 0;
  const activeChats = chatLinks?.filter(link => link.status === 'active').length || 0;
  const recentLeads = leads?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {session?.user?.name || 'User'}!
        </p>
      </div>

      {loadingCompany ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Loading company...</p>
          </CardContent>
        </Card>
      ) : company ? (
        <Card>
          <CardHeader>
            <CardTitle>{company.name}</CardTitle>
            <CardDescription>
              {company.description || 'Your lead magnet company'}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              Lead URLs added
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeChats}</div>
            <p className="text-xs text-muted-foreground">
              Chat links generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/leads">
              <Button className="w-full" size="sm">
                Add Lead
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>Your latest lead URLs</CardDescription>
            </div>
            <Link href="/dashboard/leads">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No leads yet</p>
              <Link href="/dashboard/leads">
                <Button variant="link" className="mt-2">
                  Add your first lead
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div
                  key={lead._id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {lead.title || lead.url}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {lead.url}
                    </p>
                  </div>
                  <div className="ml-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      lead.status === 'completed' ? 'bg-green-100 text-green-800' :
                      lead.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      lead.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lead.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
