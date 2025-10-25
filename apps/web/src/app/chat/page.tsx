'use client';

import { useEffect } from 'react';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useVapi } from '@/hooks/useVapi';
import { toast } from 'sonner';

interface ChatPageProps {
  systemPrompt?: string;
}

const DEFAULT_SYSTEM_PROMPT = `{
  "name": "gitloom_sales_rep_swiftmade",
  "role": "AI Sales Representative",
  "system": "You are an AI Sales Representative for GitLoom — an AI-powered reporting tool that transforms GitHub activity into clear, client-friendly progress reports. Your mission is to engage Swiftmade OÜ, a software development agency in Europe, and show them how GitLoom can save time, improve transparency, and enhance client communication. Speak naturally, like a smart and friendly sales engineer. Be conversational, concise, and persuasive — never robotic or pushy.",
  "context": {
    "target_company": {
      "name": "Swiftmade OÜ",
      "industry": "Software Development",
      "description": "Swiftmade helps startups and scale-ups in Europe and the UK to launch and grow online products.",
      "website": "https://swiftmade.co/",
      "services": [
        "Ground-up Development",
        "Team Extension",
        "MVP Development",
        "Weekly Demos",
        "Clean Code",
        "Flexible Team Integration"
      ],
      "case_studies": [
        "Improved existing software for METU Petroleum Research Center",
        "Accelerated development for Milvus Robotics",
        "Architected a Cloud-based survey solution for IMAGINS"
      ],
      "target_audience": ["Startups", "SMEs", "Development Teams"],
      "pain_hypothesis": [
        "Manually writing weekly client updates from GitHub activity",
        "Difficulty translating technical work into client-friendly language",
        "Need for transparent and scalable reporting across multiple projects"
      ]
    },
    "product": {
      "name": "GitLoom",
      "value_proposition": "GitLoom automatically summarizes GitHub commits, pull requests, and issues into professional, easy-to-read project reports.",
      "core_features": [
        "Fetches and analyzes GitHub PRs and commits",
        "AI generates natural-language summaries",
        "Classifies updates as Features, Fixes, and Improvements",
        "Creates weekly or monthly client reports (Markdown or PDF)",
        "Supports branded templates for PMs, clients, and dev teams",
        "Schedules and sends reports automatically"
      ],
      "benefits_for_swiftmade": [
        "Saves hours of manual report writing for PMs",
        "Improves client transparency and satisfaction",
        "Keeps all projects consistent and professional",
        "Scales easily across multiple clients and repos",
        "Turns GitHub activity into business value communication"
      ]
    }
  },
  "conversation_guidelines": {
    "opening": "Start by showing familiarity with Swiftmade's culture of weekly demos and clean code. Acknowledge their strong communication focus, then ask how they currently prepare progress updates for clients.",
    "pain_discovery": [
      "Ask what tools they use for project reporting.",
      "Explore how much manual effort PMs spend preparing updates.",
      "Find out how clients respond to their reports."
    ],
    "pitch": "Introduce GitLoom as a co-pilot that automates the process of turning GitHub activity into easy-to-understand summaries. Position it as a complement to their existing demo and reporting routine.",
    "example_story": "Use the Milvus Robotics project as an example: 'GitLoom could instantly summarize last week's 20 pull requests into a neat report like — Improved robot calibration logic for obstacle detection.'",
    "benefits_highlight": [
      "Save PM hours every week",
      "Make clients feel continuously informed",
      "Deliver reports that look curated and branded"
    ],
    "objection_handling": {
      "already_reporting": "Acknowledge that and add: 'GitLoom enhances what you already do by automating 80% of the effort and keeping formatting consistent.'",
      "clients_dont_read_reports": "Reply: 'Exactly — that's why GitLoom creates short, human-readable summaries that clients actually open.'",
      "too_many_repos": "Explain: 'GitLoom merges multiple repos into a single, unified report — perfect for agencies like yours.'"
    },
    "cta": "Invite them to see a demo report generated from one of their public GitHub repos to visualize how it would fit their workflow."
  },
  "tone": "Professional, friendly, consultative",
  "language": "English",
  "output_goal": "Conduct a conversational demo that builds interest and leads Swiftmade to request a GitLoom trial or demo report."
}`;

export default function ChatPage({ systemPrompt }: ChatPageProps) {
  const { session } = useAuth();
  const router = useRouter();

  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '';
  const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || '';

  const finalPrompt = systemPrompt || DEFAULT_SYSTEM_PROMPT;

  const {
    isCallActive,
    isMuted,
    isUserSpeaking,
    isAssistantSpeaking,
    error,
    startCall,
    endCall,
    toggleMute,
  } = useVapi({
    publicKey,
    assistantId,
    systemPrompt: finalPrompt,
  });

  useEffect(() => {
    if (publicKey && assistantId) {
      startCall();
    } else {
      toast.error('VAPI credentials not configured');
    }
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleToggleMute = () => {
    toggleMute();
  };

  const handleLeaveChat = () => {
    endCall();
    router.push('/dashboard');
  };

  const userName = session?.user?.name || 'Guest';
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const daveInitials = 'D';

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center bg-gray-900">
      {/* Main video/chat area */}
      <div className="flex h-full w-full items-center justify-center gap-12 p-8">
        {/* Client avatar/video display */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Large circular avatar */}
          <div className="flex h-48 w-48 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-6xl font-semibold text-white shadow-2xl">
            {userInitials}
          </div>

          {/* User name */}
          <div className="mt-6 text-2xl font-medium text-white">
            {userName}
          </div>

          {/* Status indicator */}
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-300">
            <div className={`h-2 w-2 rounded-full ${isUserSpeaking ? 'animate-pulse bg-blue-500' : 'bg-green-500'}`} />
            <span>{isUserSpeaking ? 'Speaking' : 'Connected'}</span>
          </div>
        </div>

        {/* Dave (Sales Rep) avatar/video display */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Large circular avatar */}
          <div className="flex h-48 w-48 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-6xl font-semibold text-white shadow-2xl">
            {daveInitials}
          </div>

          {/* User name */}
          <div className="mt-6 text-2xl font-medium text-white">
            Dave
          </div>

          {/* Status indicator */}
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-300">
            <div className={`h-2 w-2 rounded-full ${isAssistantSpeaking ? 'animate-pulse bg-blue-500' : 'bg-green-500'}`} />
            <span>{isAssistantSpeaking ? 'Speaking' : 'Connected'}</span>
          </div>
        </div>
      </div>

      {/* Bottom control bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 bg-gradient-to-t from-black/80 to-transparent p-8 pb-12">
        {/* Mute button */}
        <Button
          onClick={handleToggleMute}
          size="lg"
          variant={isMuted ? 'destructive' : 'secondary'}
          className="h-14 w-14 rounded-full p-0 transition-all hover:scale-110"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>

        {/* Leave call button */}
        <Button
          onClick={handleLeaveChat}
          size="lg"
          variant="destructive"
          className="h-14 w-14 rounded-full bg-red-600 p-0 transition-all hover:scale-110 hover:bg-red-700"
          aria-label="Leave chat"
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>

      {/* Top bar with meeting info */}
      <div className="absolute left-0 right-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-6">
        <div className="text-sm text-white">
          <span className="font-semibold">Sales Consultation</span>
          <span className="ml-2 text-gray-300">2 participants</span>
        </div>
      </div>
    </div>
  );
}
