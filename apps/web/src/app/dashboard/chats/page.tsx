'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Copy, ExternalLink, Check } from 'lucide-react';
import { useAuthQuery, useAuthMutation } from '@/hooks/useConvexQuery';
import { api } from '@invoice-tracker/backend/convex/_generated/api';
import { toast } from 'sonner';
import { Id } from '@invoice-tracker/backend/convex/_generated/dataModel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ChatsPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<Id<'leads'> | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const { data: leads } = useAuthQuery(api.leads.list, {});
  const { data: chatLinks, isPending } = useAuthQuery(api.chatLinks.list, {});
  const { mutate: generateLink } = useAuthMutation(api.chatLinks.generate);

  const handleGenerateLink = async () => {
    if (!selectedLeadId) {
      toast.error('Please select a lead');
      return;
    }

    try {
      const result = await generateLink({
        leadId: selectedLeadId,
      });
      toast.success('Chat link generated!');
      setSelectedLeadId(null);
    } catch (error) {
      toast.error('Failed to generate link');
    }
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(url);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chat Links</h1>
        <p className="text-muted-foreground mt-1">
          Generate and manage chat links for your leads
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate New Chat Link</CardTitle>
          <CardDescription>
            Create a unique chat link for a lead
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Select
              value={selectedLeadId || ''}
              onValueChange={(value) => setSelectedLeadId(value as Id<'leads'>)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a lead" />
              </SelectTrigger>
              <SelectContent>
                {leads?.map((lead) => (
                  <SelectItem key={lead._id} value={lead._id}>
                    {lead.title || lead.url}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleGenerateLink} disabled={!selectedLeadId}>
              Generate Link
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Chat Links</CardTitle>
          <CardDescription>
            {chatLinks?.length || 0} link{chatLinks?.length !== 1 ? 's' : ''} created
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <p className="text-muted-foreground">Loading chat links...</p>
          ) : chatLinks?.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No chat links yet</h3>
              <p className="text-muted-foreground mb-4">
                Generate your first chat link to start conversations
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {chatLinks?.map((link) => {
                const lead = leads?.find((l) => l._id === link.leadId);
                return (
                  <div
                    key={link._id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">
                          {lead?.title || lead?.url || 'Unknown Lead'}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            link.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : link.status === 'used'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {link.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate font-mono">
                        {link.url}
                      </p>
                      {link.lastAccessedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Last accessed: {new Date(link.lastAccessedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopyLink(link.url)}
                      >
                        {copiedLink === link.url ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(link.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
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
