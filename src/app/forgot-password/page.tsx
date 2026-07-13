'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, GalleryVerticalEnd, ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/ui/logo';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    setIsLoading(true);
    try {
      // Logic for sending reset email would go here
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast.success('Password reset link sent to your email!');
        form.reset();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to send reset link');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      {/* Left Side: Image Banner */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed inset-y-0 left-0 hidden w-1/2 bg-muted lg:block"
      >
        <Image
          src="/assets/forgetpassrod.webp"
          alt="Forgot Password Banner"
          fill
          priority
          sizes="50vw"
          className="absolute inset-0 h-full w-full object-cover brightness-[0.8] contrast-[1.1]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-white mb-4 font-serif">Secure Your Account</h2>
            <p className="text-lg text-white/80 max-w-md">
              Don't worry, it happens to the best of us. Let's get you back into your account.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side: Forgot Password Form */}
      <div className="flex flex-col p-6 md:p-10 bg-background lg:ml-[50%] min-h-screen">
        <div className="flex justify-center gap-2 md:justify-start mb-8">
          <Logo />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-1 items-center justify-center"
        >
          <div className="w-full max-w-sm space-y-8">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight">Forgot password?</h1>
              <p className="text-sm text-muted-foreground text-balance">
                Enter your email address and we'll send you a link to reset your password
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="m@example.com"
                          type="email"
                          {...field}
                          disabled={isLoading}
                          className="h-11 focus-visible:ring-primary/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <span className="flex items-center justify-center">
                        Send Reset Link <Send className="ml-2 h-4 w-4" />
                      </span>
                    )}
                  </Button>

                  <Button variant="ghost" className="w-full h-11" asChild>
                    <Link href="/login">
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to login
                    </Link>
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </motion.div>

        <div className="mt-auto pt-6 text-center text-xs text-muted-foreground">
          Need help? Contact our{' '}
          <Link href="/support" className="underline underline-offset-4 hover:text-primary">
            Support Team
          </Link>.
        </div>
      </div>
    </div>
  );
}

