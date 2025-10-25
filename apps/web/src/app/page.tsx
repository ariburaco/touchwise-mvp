'use client';

import Header from '@/components/header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import {
  ArrowRight,
  Database,
  Globe,
  Lock,
  Rocket,
  Shield,
  Star,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const { session } = useAuth();

  const features = [
    {
      icon: <Database className="h-6 w-6" />,
      title: 'Real-time Database',
      description:
        'Powered by Convex for instant data synchronization across all clients',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Secure Authentication',
      description:
        'Better Auth integration with email/password and OAuth providers',
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: 'Internationalization',
      description:
        'Multi-language support with typed translations out of the box',
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Lightning Fast',
      description:
        'Next.js 15 with React Server Components for optimal performance',
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: 'Type Safety',
      description: 'Full TypeScript support with end-to-end type safety',
    },
    {
      icon: <Rocket className="h-6 w-6" />,
      title: 'Production Ready',
      description:
        'Best practices, testing, and deployment configurations included',
    },
  ];

  const techStack = [
    'Next.js 15',
    'Convex',
    'Better Auth',
    'TypeScript',
    'Tailwind CSS v4',
    'shadcn/ui',
    'React Query',
    'Turborepo',
  ];

  return (
    <>
      <Header />
      <div className="flex flex-col min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-background to-secondary/20 px-4 py-20 md:py-32">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col items-center text-center space-y-8">
              <Badge variant="secondary" className="px-4 py-1">
                <Star className="h-3 w-3 mr-1" />
                Production-Ready Starter Kit
              </Badge>

              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Build Modern Apps with{' '}
                <span className="text-primary">Convex + Next.js</span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-2xl">
                The ultimate starter template with real-time database,
                authentication, internationalization, and everything you need to
                ship fast.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                {session ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="min-w-[200px]">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/signup">
                      <Button size="lg" className="min-w-[200px]">
                        Get Started Free
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/auth/login">
                      <Button
                        size="lg"
                        variant="outline"
                        className="min-w-[200px]"
                      >
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </div>
              {/* Tech Stack Pills */}
              <div className="flex flex-wrap gap-2 justify-center mt-8">
                {techStack.map((tech) => (
                  <Badge key={tech} variant="outline" className="px-3 py-1">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>
        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
              <p className="text-muted-foreground text-lg">
                Start with a solid foundation and focus on building your product
              </p>
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
        {/* CTA Section */}
        <section className="py-20 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Build Something Amazing?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join developers who are shipping faster with our starter kit
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="https://github.com/yourusername/convex-template"
                target="_blank"
              >
                <Button size="lg" variant="outline">
                  View on GitHub
                </Button>
              </Link>
              <Link href="/docs">
                <Button size="lg" variant="outline">
                  Documentation
                </Button>
              </Link>
            </div>
          </div>
        </section>
        {/* Simple Footer */}
        <footer className="mt-auto border-t py-8 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center space-x-2">
                <span className="font-semibold">Convex Template</span>
                <span className="text-muted-foreground">© 2024</span>
              </div>

              <div className="flex gap-6 text-sm">
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
                <Link
                  href="/contact"
                  className="hover:text-primary transition-colors"
                >
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
