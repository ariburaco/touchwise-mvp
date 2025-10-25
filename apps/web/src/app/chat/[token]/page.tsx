'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@invoice-tracker/backend/convex/_generated/api';
import { Id } from '@invoice-tracker/backend/convex/_generated/dataModel';

export default function ChatPage() {
  const params = useParams();
  const token = params.token as string;

  const [sessionId, setSessionId] = useState<Id<'chatSessions'> | null>(null);
  const [message, setMessage] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [showNameForm, setShowNameForm] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatLink = useQuery(api.chatLinks.getByToken, { token });
  const messages = sessionId
    ? useQuery(api.chats.getMessages, { sessionId })
    : undefined;
  const createSession = useMutation(api.chats.createSession);
  const addMessage = useMutation(api.chats.addMessage);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleStartChat = async () => {
    if (!visitorName.trim()) return;

    try {
      const session = await createSession({
        chatLinkToken: token,
        visitorName: visitorName.trim(),
      });
      setSessionId(session?._id as Id<'chatSessions'>);
      setShowNameForm(false);

      await addMessage({
        sessionId: session?._id as Id<'chatSessions'>,
        role: 'system',
        content: `Welcome ${visitorName}! How can we help you today?`,
      });
    } catch (error) {
      alert('Failed to start chat. Please try again.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !sessionId) return;

    const userMessage = message.trim();
    setMessage('');

    try {
      await addMessage({
        sessionId,
        role: 'user',
        content: userMessage,
      });

      setTimeout(async () => {
        await addMessage({
          sessionId,
          role: 'assistant',
          content: 'Thank you for your message. Our team will respond shortly.',
        });
      }, 1000);
    } catch (error) {
      alert('Failed to send message');
    }
  };

  if (!chatLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Loading chat...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardTitle className="text-2xl">
              Chat with {chatLink.company?.name || 'Us'}
            </CardTitle>
            <p className="text-blue-100 text-sm">
              {chatLink.company?.description || 'We are here to help'}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {showNameForm ? (
              <div className="p-8">
                <h3 className="text-lg font-semibold mb-4">Start a conversation</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Your name
                    </label>
                    <Input
                      placeholder="Enter your name"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleStartChat();
                      }}
                    />
                  </div>
                  <Button onClick={handleStartChat} className="w-full">
                    Start Chat
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gray-50">
                  {messages?.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {msg.role !== 'user' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                            <Bot className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : msg.role === 'system'
                            ? 'bg-gray-200 text-gray-800'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                      {msg.role === 'user' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t bg-white">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={!message.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
