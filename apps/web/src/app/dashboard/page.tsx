'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Briefcase, MessageSquare, TrendingUp, Pencil, Save, X } from 'lucide-react';
import Link from 'next/link';
import { useAuthQuery, useAuthMutation } from '@/hooks/useConvexQuery';
import { api } from '@invoice-tracker/backend/convex/_generated/api';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { session } = useAuth();
  const [initialized, setInitialized] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { mutate: getOrCreateCompany } = useAuthMutation(api.companies.getOrCreateDefault);
  const { mutate: updateCompany } = useAuthMutation(api.companies.update);
  const { data: leads } = useAuthQuery(api.leads.list, {});
  const { data: chatLinks } = useAuthQuery(api.chatLinks.list, {});

  const [company, setCompany] = useState<any>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);

  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    industry: '',
    url: '',
  });

  useEffect(() => {
    if (!initialized && session) {
      getOrCreateCompany({})
        .then((result) => {
          setCompany(result);
          setEditForm({
            name: result.name || '',
            description: result.description || '',
            industry: result.details?.industry || '',
            url: result.details?.url || '',
          });
          setLoadingCompany(false);
          setInitialized(true);
        })
        .catch((error) => {
          setLoadingCompany(false);
        });
    }
  }, [initialized, session, getOrCreateCompany]);

  const handleEdit = () => {
    setEditForm({
      name: company.name || '',
      description: company.description || '',
      industry: company.details?.industry || '',
      url: company.details?.url || '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!company?._id) return;

    const name = editForm.name.trim();
    if (!name) {
      toast.error('Company name is required');
      return;
    }

    try {
      const industry = editForm.industry.trim() || undefined;
      const url = editForm.url.trim() || undefined;

      console.log('Updating company with:', {
        companyId: company._id,
        name,
        description: editForm.description.trim() || undefined,
        details: industry || url ? { industry, url } : undefined,
      });

      const result = await updateCompany({
        companyId: company._id,
        name,
        description: editForm.description.trim() || undefined,
        details: industry || url ? {
          industry,
          url,
        } : undefined,
      });

      console.log('Update result:', result);
      setCompany(result);
      setIsEditing(false);
      toast.success('Company updated successfully');
    } catch (error) {
      console.error('Update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update company';
      toast.error(errorMessage);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

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
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Company Name</Label>
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Company name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Company description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="industry">Industry</Label>
                        <Input
                          id="industry"
                          value={editForm.industry}
                          onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                          placeholder="e.g., SaaS, E-commerce"
                        />
                      </div>
                      <div>
                        <Label htmlFor="url">Website URL</Label>
                        <Input
                          id="url"
                          type="url"
                          value={editForm.url}
                          onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button onClick={handleCancel} variant="outline" size="sm">
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <CardTitle className="flex items-center gap-2">
                      {company.name}
                      {company.details?.url && (
                        <a
                          href={company.details.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          🔗
                        </a>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {company.details?.industry && (
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">
                          {company.details.industry}
                        </span>
                      )}
                      {company.description || 'Your lead magnet company'}
                    </CardDescription>
                  </>
                )}
              </div>
              {!isEditing && (
                <Button onClick={handleEdit} variant="ghost" size="icon">
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
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
