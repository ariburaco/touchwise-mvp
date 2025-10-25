'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import confetti from 'canvas-confetti';

export default function BillingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get('checkout_id');

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 relative">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Welcome to Pro! Your subscription is now active.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <h4 className="font-medium mb-2">What's next?</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                <span>All Pro features are now unlocked</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                <span>You'll receive a confirmation email shortly</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Access your billing portal anytime from settings</span>
              </li>
            </ul>
          </div>

          {checkoutId && (
            <div className="text-center text-xs text-muted-foreground">
              Checkout ID: {checkoutId}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            className="flex-1"
            onClick={() => router.push('/dashboard')}
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push('/dashboard/billing')}
          >
            View Billing
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}