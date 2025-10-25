'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Zap, Building2, Sparkles, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';
import {
  useAuthAction,
  useAuthMutation,
  useAuthQuery,
} from '@/hooks/useConvexQuery';
import { useAction } from 'convex/react';
import { api } from '@invoice-tracker/backend/convex/_generated/api';

const plans = [
  {
    name: 'Free',
    slug: 'free',
    icon: Sparkles,
    description: 'Perfect for getting started',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      '5 projects',
      '1 team member',
      'Basic analytics',
      'Community support',
      '1GB storage',
    ],
    notIncluded: [
      'Priority support',
      'Advanced analytics',
      'Custom integrations',
      'API access',
    ],
  },
  {
    name: 'Pro',
    slug: 'pro',
    icon: Zap,
    description: 'For growing teams and businesses',
    monthlyPrice: 29,
    annualPrice: 290,
    popular: true,
    features: [
      'Unlimited projects',
      'Up to 10 team members',
      'Advanced analytics',
      'Priority support',
      '100GB storage',
      'API access',
      'Custom integrations',
      'Advanced security',
    ],
    notIncluded: ['Dedicated account manager', 'Custom contracts'],
  },
  {
    name: 'Team',
    slug: 'team',
    icon: Building2,
    description: 'For larger organizations',
    monthlyPrice: 99,
    annualPrice: 990,
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'Dedicated account manager',
      'Custom contracts',
      'SLA guarantee',
      'Advanced admin controls',
      'Audit logs',
      'Unlimited storage',
      'White-label options',
      'Custom integrations',
    ],
    notIncluded: [],
  },
];

const lifetimePlan = {
  name: 'Lifetime',
  slug: 'lifetime',
  icon: Crown,
  description: 'One-time payment, lifetime access',
  price: 299,
  isLifetime: true,
  badge: 'Limited Offer',
  features: [
    'Everything in Pro plan',
    'Lifetime updates',
    'No recurring payments',
    'Early access to new features',
    'Priority support forever',
    'Transferable license',
    'Exclusive lifetime member badge',
    'Access to beta features',
  ],
  notIncluded: [],
};

export default function PricingPage() {
  const router = useRouter();
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const { data: session } = authClient.useSession();
  const { data: activeSubscription } = useAuthQuery(
    api.subscriptions.getActiveSubscription,
    {}
  );

  const createOrSyncCustomer = useAuthMutation(
    api.polarCustomers.createOrSyncCustomer
  );

  const handleCheckout = async (planSlug: string) => {
    if (planSlug === 'free') {
      return; // Free plan doesn't need checkout
    }

    if (!session?.user) {
      router.push('/auth/login?redirect=/pricing');
      return;
    }

    setLoading(planSlug);

    try {
      // Ensure user has a Polar customer (for existing users)
      try {
        await createOrSyncCustomer.mutate({});
      } catch (syncError) {
        console.log('Customer sync error (might already exist):', syncError);
        // Continue even if sync fails - user might already have a customer
      }

      // Initiate Polar checkout - email will be locked-in from the customer
      await authClient.checkout({
        slug: planSlug,
      });
    } catch (error) {
      console.error('Checkout error:', error);
      // TODO: Show error toast
    } finally {
      setLoading(null);
    }
  };

  const currentPlan = activeSubscription?.productName?.toLowerCase() || 'free';
  const hasLifetimeAccess = activeSubscription?.isLifetime === true;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <Badge className="mb-4" variant="secondary">
            Pricing
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Choose your perfect plan
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Start free and upgrade as you grow. No hidden fees.
          </p>

          {/* Annual/Monthly Toggle */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <Label htmlFor="annual-toggle" className="text-base cursor-pointer">
              Monthly
            </Label>
            <Switch
              id="annual-toggle"
              checked={annual}
              onCheckedChange={setAnnual}
            />
            <Label htmlFor="annual-toggle" className="text-base cursor-pointer">
              Annual
              <Badge variant="default" className="ml-2">
                Save 20%
              </Badge>
            </Label>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-8">
          {plans.map((plan) => {
            const price = annual ? plan.annualPrice : plan.monthlyPrice;
            const isCurrentPlan = currentPlan === plan.slug;
            const Icon = plan.icon;

            return (
              <Card
                key={plan.slug}
                className={`relative ${
                  plan.popular ? 'border-primary shadow-lg scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}

                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        ${price / (annual && price > 0 ? 10 : 1)}
                      </span>
                      {price > 0 && (
                        <span className="text-muted-foreground">
                          /{annual ? 'month' : 'month'}
                        </span>
                      )}
                    </div>
                    {annual && price > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        ${price} billed annually
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                    {plan.notIncluded.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 opacity-50"
                      >
                        <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-sm line-through">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    disabled={isCurrentPlan || loading === plan.slug}
                    onClick={() => handleCheckout(plan.slug)}
                  >
                    {loading === plan.slug
                      ? 'Processing...'
                      : isCurrentPlan
                        ? 'Current Plan'
                        : plan.slug === 'free'
                          ? 'Get Started'
                          : 'Upgrade'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Lifetime Plan Card */}
        <div className="max-w-2xl mx-auto">
          <Card className="relative border-yellow-500/50 bg-gradient-to-br from-yellow-50/10 to-transparent dark:from-yellow-900/10">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-white">
              {lifetimePlan.badge}
            </Badge>

            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-6 w-6 text-yellow-500" />
                  <CardTitle className="text-2xl">
                    {lifetimePlan.name}
                  </CardTitle>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    ${lifetimePlan.price}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    one-time payment
                  </p>
                </div>
              </div>
              <CardDescription className="mt-2">
                {lifetimePlan.description}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {lifetimePlan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                size="lg"
                disabled={hasLifetimeAccess || loading === 'lifetime'}
                onClick={() => handleCheckout('lifetime')}
              >
                {loading === 'lifetime'
                  ? 'Processing...'
                  : hasLifetimeAccess
                    ? 'You have lifetime access!'
                    : 'Get Lifetime Access'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            All plans include SSL certificates, 99.9% uptime SLA, and GDPR
            compliance.
          </p>
          <p className="text-muted-foreground mt-2">
            Need a custom plan?{' '}
            <Button variant="link" className="px-0">
              Contact sales
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
