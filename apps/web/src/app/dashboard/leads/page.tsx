'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Briefcase, Plus, Trash2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthQuery, useAuthMutation } from '@/hooks/useConvexQuery';
import { api } from '@invoice-tracker/backend/convex/_generated/api';
import { toast } from 'sonner';
import { Id } from '@invoice-tracker/backend/convex/_generated/dataModel';
import { useAuth } from '@/lib/auth-context';

export default function LeadsPage() {
  const { session } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [expandedLead, setExpandedLead] = useState<Id<'leads'> | null>(null);

  const { mutate: getOrCreateCompany } = useAuthMutation(api.companies.getOrCreateDefault);
  const { data: leads, isPending } = useAuthQuery(api.leads.list, {});
  const { mutate: createLead } = useAuthMutation(api.leads.create);
  const { mutate: deleteLead } = useAuthMutation(api.leads.remove);

  useEffect(() => {
    if (!initialized && session) {
      getOrCreateCompany({})
        .then((result) => {
          setCompany(result);
          setInitialized(true);
        })
        .catch(() => {
          toast.error('Failed to load company');
        });
    }
  }, [initialized, session, getOrCreateCompany]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url) {
      toast.error('URL is required');
      return;
    }

    if (!company?._id) {
      toast.error('Company not loaded. Please wait...');
      return;
    }

    try {
      await createLead({
        companyId: company._id,
        url,
        title: title || undefined,
        description: description || undefined,
      });

      toast.success('Lead added successfully');
      setUrl('');
      setTitle('');
      setDescription('');
      setShowAddForm(false);
    } catch (error) {
      toast.error('Failed to add lead');
    }
  };

  const handleDelete = async (leadId: Id<'leads'>) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      await deleteLead({ leadId });
      toast.success('Lead deleted');
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground mt-1">
            Manage your lead URLs
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Lead</CardTitle>
            <CardDescription>Enter the company URL to analyze</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="url">Company URL *</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  placeholder="Company name"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Notes (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Additional notes"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Add Lead</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Leads</CardTitle>
          <CardDescription>
            {leads?.length || 0} lead{leads?.length !== 1 ? 's' : ''} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <p className="text-muted-foreground">Loading leads...</p>
          ) : leads?.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No leads yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first lead to get started
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {leads?.map((lead) => {
                const isExpanded = expandedLead === lead._id;
                let knowledgeData = null;
                try {
                  if (lead.knowledgeBase) {
                    knowledgeData = JSON.parse(lead.knowledgeBase);
                  }
                } catch (e) {
                  // Invalid JSON
                }

                return (
                  <div key={lead._id} className="border rounded-lg">
                    <div className="flex items-center justify-between p-4 hover:bg-accent transition-colors">
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">
                            {lead.title || 'Untitled'}
                          </h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              lead.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : lead.status === 'processing'
                                ? 'bg-blue-100 text-blue-800'
                                : lead.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {lead.status}
                          </span>
                        </div>
                        <a
                          href={lead.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {lead.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {lead.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {lead.description}
                          </p>
                        )}
                        {lead.errorMessage && (
                          <p className="text-sm text-red-600 mt-1">
                            Error: {lead.errorMessage}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {lead.status === 'completed' && lead.knowledgeBase && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setExpandedLead(isExpanded ? null : lead._id)
                            }
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(lead._id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {isExpanded && knowledgeData && (
                      <div className="border-t p-4 bg-gray-50">
                        <h4 className="font-semibold mb-3">
                          Extracted Company Information
                        </h4>
                        <div className="grid gap-4 md:grid-cols-2">
                          {knowledgeData.companyInfo?.company_name && (
                            <div>
                              <p className="text-sm font-medium text-gray-600">
                                Company Name
                              </p>
                              <p className="text-sm">
                                {knowledgeData.companyInfo.company_name}
                              </p>
                            </div>
                          )}
                          {knowledgeData.companyInfo?.industry && (
                            <div>
                              <p className="text-sm font-medium text-gray-600">
                                Industry
                              </p>
                              <p className="text-sm">
                                {knowledgeData.companyInfo.industry}
                              </p>
                            </div>
                          )}
                          {knowledgeData.companyInfo?.value_proposition && (
                            <div className="md:col-span-2">
                              <p className="text-sm font-medium text-gray-600">
                                Value Proposition
                              </p>
                              <p className="text-sm">
                                {knowledgeData.companyInfo.value_proposition}
                              </p>
                            </div>
                          )}
                          {knowledgeData.companyInfo?.features?.length > 0 && (
                            <div className="md:col-span-2">
                              <p className="text-sm font-medium text-gray-600 mb-1">
                                Features
                              </p>
                              <ul className="text-sm list-disc list-inside space-y-1">
                                {knowledgeData.companyInfo.features.map(
                                  (feature: string, idx: number) => (
                                    <li key={idx}>{feature}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                          {knowledgeData.companyInfo?.target_audience?.length >
                            0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-1">
                                Target Audience
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {knowledgeData.companyInfo.target_audience.map(
                                  (audience: string, idx: number) => (
                                    <span
                                      key={idx}
                                      className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                                    >
                                      {audience}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                          {knowledgeData.companyInfo?.pricing?.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-1">
                                Pricing
                              </p>
                              <ul className="text-sm space-y-1">
                                {knowledgeData.companyInfo.pricing.map(
                                  (price: string, idx: number) => (
                                    <li key={idx}>{price}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-4">
                          Extracted at:{' '}
                          {new Date(
                            knowledgeData.extractedAt
                          ).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
