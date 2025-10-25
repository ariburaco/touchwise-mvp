'use client';

import Header from '@/components/header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import {
  ArrowRight,
  Building2,
  Check,
  Link2,
  MessageSquare,
  Mic,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const { session } = useAuth();
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);

  // Floating CTA after scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 800) {
        setShowFloatingCTA(true);
      } else {
        setShowFloatingCTA(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Exit intent popup
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !showExitIntent) {
        setShowExitIntent(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [showExitIntent]);

  const problemPoints = [
    {
      icon: <X className="h-5 w-5" />,
      text: 'You spend hours checking each lead\'s website before writing',
    },
    {
      icon: <X className="h-5 w-5" />,
      text: 'Conversations stay cold and generic',
    },
    {
      icon: <X className="h-5 w-5" />,
      text: 'No unified place to manage your outreach and insights',
    },
  ];

  const howItWorksSteps = [
    {
      step: '1',
      title: 'Add a Company URL',
      description:
        'Touchwise crawls and understands any SaaS website — extracting key info like product, audience, and value proposition.',
    },
    {
      step: '2',
      title: 'Get Instant Overview',
      description:
        'You\'ll see an AI-generated company summary with sales angles and tone detection — ready for your pitch.',
    },
    {
      step: '3',
      title: 'Add Your Lead',
      description:
        'Save the person you\'re reaching out to. Touchwise links them to the company and creates a personalized chat space.',
    },
    {
      step: '4',
      title: 'Share the Chat Link',
      description:
        'Send a private chat link to your lead — they\'ll chat directly with your AI assistant that already knows everything about your product and theirs.',
    },
  ];

  const features = [
    {
      icon: <Search className="h-6 w-6" />,
      title: 'Company Intelligence',
      description: 'Auto-generate insights from any company website.',
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Lead Manager',
      description: 'Keep all your prospects organized, enriched, and linked.',
    },
    {
      icon: <Link2 className="h-6 w-6" />,
      title: 'Smart Chat Links',
      description: 'One click to open a personalized AI chat experience.',
    },
    {
      icon: <Mic className="h-6 w-6" />,
      title: 'Voice Chat',
      description:
        'Talk with leads directly — your AI assistant listens and speaks.',
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: 'Dashboard View',
      description: 'Track active chats, conversions, and lead activity.',
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: 'AI-Powered',
      description: 'Smart conversations that understand context and intent.',
    },
  ];

  const testimonials = [
    {
      quote: 'Saved me 2 hours per lead.',
      icon: <Zap className="h-5 w-5" />,
    },
    {
      quote: 'Our outreach finally sounds human.',
      icon: <Target className="h-5 w-5" />,
    },
    {
      quote: 'Plugged straight into our Notion CRM.',
      icon: <Check className="h-5 w-5" />,
    },
  ];

  const pricingTiers = [
    {
      name: 'Early Access',
      price: '$0',
      period: 'until Dec 31',
      features: [
        'Full features',
        'Unlimited usage',
        'Priority support',
        'Founder badge',
      ],
      highlighted: true,
      cta: 'Start Free — No Card Needed',
    },
    {
      name: 'Starter',
      price: '$29',
      period: '/month',
      features: [
        '100 leads/month',
        'AI chat support',
        'Voice support',
        'Basic analytics',
      ],
      highlighted: false,
      cta: 'Get Started',
    },
    {
      name: 'Pro',
      price: '$79',
      period: '/month',
      features: [
        'Unlimited leads',
        'Advanced AI',
        'All integrations',
        'Priority support',
      ],
      highlighted: false,
      cta: 'Get Started',
    },
  ];


  return (
    <>
      <Header />
      <div className="flex flex-col min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-background via-primary/5 to-background px-4 py-20 md:py-32">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col items-center text-center space-y-8">
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Sparkles className="h-4 w-4 mr-2" />
                Free Until December — Join 100+ Early Adopters
              </Badge>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
                Convert Your SaaS Leads
                <br />
                Into{' '}
                <span className="text-primary bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Conversations
                </span>{' '}
                — Instantly
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl leading-relaxed">
                Touchwise turns your website into an interactive AI Sales
                Assistant that knows your product, your audience, and your
                leads. Generate chat links, talk to leads, and let AI handle
                the conversation — all in one place.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {session ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="min-w-[240px] h-14 text-lg">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/signup">
                      <Button size="lg" className="min-w-[240px] h-14 text-lg">
                        Get Started Free Until December
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <a href="#how-it-works">
                      <Button
                        size="lg"
                        variant="outline"
                        className="min-w-[240px] h-14 text-lg"
                      >
                        See How It Works
                      </Button>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
        </section>

        {/* Voice Chat Agent Mock View */}
        <section className="py-20 px-4 bg-background">
          <div className="container mx-auto max-w-5xl">
            <div className="relative">
              {/* Main Chat Interface */}
              <Card className="border-2 shadow-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                        <Mic className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">AI Sales Assistant</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Ready to help your leads
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm font-medium text-green-600">
                        Active
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 bg-secondary/20 min-h-[400px]">
                  {/* Chat Messages */}
                  <div className="space-y-4">
                    {/* AI Message */}
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-background rounded-lg p-4 shadow-sm border">
                          <p className="text-sm">
                            Hi! I'm your AI assistant. I've analyzed your
                            company and I'm ready to have personalized
                            conversations with your leads. How can I help today?
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 ml-1">
                          Just now
                        </p>
                      </div>
                    </div>

                    {/* User Message */}
                    <div className="flex items-start space-x-3 justify-end">
                      <div className="flex-1 flex justify-end">
                        <div className="max-w-[80%]">
                          <div className="bg-primary text-primary-foreground rounded-lg p-4 shadow-sm">
                            <p className="text-sm">
                              Tell me about your product features
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 mr-1 text-right">
                            Just now
                          </p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                       
                      </div>
                    </div>

                    {/* AI Typing Indicator */}
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-background rounded-lg p-4 shadow-sm border">
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                            <div
                              className="w-2 h-2 rounded-full bg-primary animate-bounce"
                              style={{ animationDelay: '0.2s' }}
                            />
                            <div
                              className="w-2 h-2 rounded-full bg-primary animate-bounce"
                              style={{ animationDelay: '0.4s' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Voice Input Area */}
                  <div className="mt-8 pt-6 border-t">
                    <div className="flex items-center space-x-4">
                      <Button
                        size="lg"
                        className="flex-1 h-14 text-base"
                        variant="outline"
                      >
                        <MessageSquare className="h-5 w-5 mr-2" />
                        Type a message
                      </Button>
                      <Button
                        size="lg"
                        className="h-14 px-8 text-base bg-gradient-to-r from-primary to-primary/80"
                      >
                        <Mic className="h-5 w-5 mr-2" />
                        Start Voice Chat
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Feature Highlights Below */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Mic className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Voice & Text</h3>
                <p className="text-sm text-muted-foreground">
                  Seamless conversation in any format
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">AI-Powered</h3>
                <p className="text-sm text-muted-foreground">
                  Understands context and intent
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Link2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Instant Sharing</h3>
                <p className="text-sm text-muted-foreground">
                  One link, unlimited conversations
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-20 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Manual lead research and cold outreach are broken.
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {problemPoints.map((point, index) => (
                <Card
                  key={index}
                  className="border-2 border-destructive/20 bg-background"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-destructive/10 rounded-lg text-destructive flex-shrink-0">
                        {point.icon}
                      </div>
                      <p className="text-muted-foreground">{point.text}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <p className="text-xl font-semibold text-primary">
                Touchwise automates all that — while keeping your tone personal
                and smart.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                How It Works
              </h2>
              <p className="text-xl text-muted-foreground">
                Simple, logical, and powerful
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {howItWorksSteps.map((step, index) => (
                <Card
                  key={index}
                  className="border-2 hover:border-primary/50 transition-all hover:shadow-xl"
                >
                  <CardHeader>
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-3xl">
                          {step.step}
                        </div>
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">
                          {step.title}
                        </CardTitle>
                        <p className="text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Badge variant="outline" className="px-6 py-3 text-base">
                <MessageSquare className="h-5 w-5 mr-2" />
                All managed inside one clean dashboard
              </Badge>
            </div>
          </div>
        </section>

        {/* Core Features Section */}
        <section className="py-20 px-4 bg-secondary/20">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Everything you need to turn SaaS websites into smart
                conversations
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="border hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        {feature.icon}
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why SaaS Teams Love Touchwise
              </h2>
              <p className="text-xl text-muted-foreground">
                "It's like having an AI SDR who already knows your ICP."
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <Card
                  key={index}
                  className="border-2 border-primary/20 bg-primary/5"
                >
                  <CardContent className="pt-2">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-primary/20 rounded-lg text-primary flex-shrink-0">
                        {testimonial.icon}
                      </div>
                      <p className="text-lg font-medium">{testimonial.quote}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-background to-secondary/20">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Get started free until December
              </h2>
              <p className="text-xl text-muted-foreground">
                Unlimited companies. Unlimited leads. Full access to the
                Touchwise Dashboard.
                <br />
                No credit card required — free trial for early adopters.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {pricingTiers.map((tier, index) => (
                <Card
                  key={index}
                  className={`border-2 ${
                    tier.highlighted
                      ? 'border-primary shadow-2xl scale-105 bg-primary/5'
                      : 'border-border'
                  } transition-all hover:shadow-xl`}
                >
                  <CardHeader>
                    {tier.highlighted && (
                      <Badge className="w-fit mb-2">Most Popular</Badge>
                    )}
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{tier.price}</span>
                      <span className="text-muted-foreground">
                        {tier.period}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <Check className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/auth/signup">
                      <Button
                        className="w-full"
                        variant={tier.highlighted ? 'default' : 'outline'}
                        size="lg"
                      >
                        {tier.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Beta Program CTA */}
        <section className="py-20 px-4 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
          <div className="container mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="px-4 py-2 text-sm mb-6">
              Limited Spots Available
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Be part of the 100 Founders Beta Program
            </h2>
            <p className="text-xl text-muted-foreground mb-6">
              Join our private early adopter group and help shape the future of
              AI sales automation.
            </p>

            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
              <div className="flex items-center space-x-2 text-left">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Lifetime Founder Badge 🏅</span>
              </div>
              <div className="flex items-center space-x-2 text-left">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Priority feature access</span>
              </div>
              <div className="flex items-center space-x-2 text-left">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Extended free usage</span>
              </div>
              <div className="flex items-center space-x-2 text-left">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Direct founder access</span>
              </div>
            </div>

            <Link href="/auth/signup">
              <Button size="lg" className="min-w-[280px] h-14 text-lg">
                Join the Beta — Free Until December
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-auto border-t py-12 px-4 bg-secondary/10">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="font-bold text-lg mb-4">Touchwise</h3>
                <p className="text-sm text-muted-foreground">
                  Turn your website and leads into smart, AI-powered
                  conversations.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <div className="flex flex-col gap-2 text-sm">
                  <Link
                    href="/dashboard"
                    className="hover:text-primary transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/pricing"
                    className="hover:text-primary transition-colors"
                  >
                    Features
                  </Link>
                  <Link
                    href="/docs"
                    className="hover:text-primary transition-colors"
                  >
                    Docs
                  </Link>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <div className="flex flex-col gap-2 text-sm">
                  <Link
                    href="/about"
                    className="hover:text-primary transition-colors"
                  >
                    About
                  </Link>
                  <Link
                    href="/privacy"
                    className="hover:text-primary transition-colors"
                  >
                    Privacy
                  </Link>
                  <Link
                    href="/terms"
                    className="hover:text-primary transition-colors"
                  >
                    Terms
                  </Link>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Social</h4>
                <div className="flex flex-col gap-2 text-sm">
                  <a
                    href="https://twitter.com/touchwise"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    Twitter
                  </a>
                  <a
                    href="https://linkedin.com/company/touchwise"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    LinkedIn
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center space-x-2">
                <span className="font-semibold">Touchwise</span>
                <span className="text-muted-foreground">© 2024</span>
              </div>

              <Link href="/auth/signup">
                <Button>Start Free</Button>
              </Link>
            </div>
          </div>
        </footer>
      </div>

      {/* Floating CTA Bar */}
      {showFloatingCTA && (
        <div className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground py-4 px-4 shadow-2xl z-50 animate-in slide-in-from-bottom">
          <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="font-semibold text-lg">
                Free Until December — Try Now
              </p>
              <p className="text-sm opacity-90">
                Join 100+ founders building smarter sales conversations
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  variant="secondary"
                  className="min-w-[180px]"
                >
                  Get Started Free
                </Button>
              </Link>
              <Button
                size="lg"
                variant="ghost"
                className="text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => setShowFloatingCTA(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Intent Popup */}
      {showExitIntent && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full border-2 border-primary shadow-2xl animate-in zoom-in-95">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl mb-2">
                    Wait! Before you go...
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Join our beta program and get free access until December
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowExitIntent(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span>Unlimited leads & companies</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span>Full AI chat & voice features</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span>Lifetime founder badge</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span>No credit card required</span>
                </li>
              </ul>
              <Link href="/auth/signup">
                <Button size="lg" className="w-full">
                  Claim Your Free Access
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
