'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, GalleryVerticalEnd, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Logo } from '@/components/ui/logo';

const resetPasswordSchema = z.object({
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string().min(1, { message: 'Confirm your password' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof resetPasswordSchema>) {
    if (!token) {
      toast.error('Invalid or missing token');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: values.password,
        }),
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || 'Server returned a non-JSON response');
      }

      if (response.ok) {
        setIsSuccess(true);
        toast.success('Password reset successfully!');
        // Redirect immediately to avoid timer issues on unmount
        router.push('/login');
      } else {
        toast.error(data.message || 'Failed to reset password');
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="w-full max-w-sm text-center space-y-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex justify-center"
        >
          <div className="rounded-full bg-primary/10 p-4">
            <CheckCircle2 className="size-12 text-primary" />
          </div>
        </motion.div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Password Reset Successful</h1>
          <p className="text-muted-foreground">
            Your password has been reset successfully. You will be redirected to the login page in a few seconds.
          </p>
        </div>
        <Link href="/login" className="block w-full">
          <Button className="w-full h-11">Go to Login</Button>
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="rounded-full bg-destructive/10 p-4 mx-auto w-fit">
          <Lock className="size-12 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Invalid Reset Link</h1>
          <p className="text-muted-foreground">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
        </div>
        <Link href="/forgot-password" className="block w-full">
          <Button className="w-full h-11">Request New Link</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Reset Password</h1>
        <p className="text-sm text-muted-foreground text-balance">
          Set a new password for your account
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      {...field}
                      disabled={isLoading}
                      className="h-11 focus-visible:ring-primary/20 pr-10"
                    />
                  </FormControl>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-sm outline-none"
                          disabled={isLoading}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>{showPassword ? "Hide password" : "Show password"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      placeholder="••••••••"
                      type={showConfirmPassword ? "text" : "password"}
                      {...field}
                      disabled={isLoading}
                      className="h-11 focus-visible:ring-primary/20 pr-10"
                    />
                  </FormControl>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-sm outline-none"
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>{showConfirmPassword ? "Hide password" : "Show password"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-11 text-base font-semibold"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              'Reset Password'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}

export default function ResetPasswordPage() {
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
          src="/assets/login_banner.jpg"
          alt="Reset Password Banner"
          fill
          priority
          sizes="50vw"
          className="absolute inset-0 h-full w-full object-cover brightness-[0.8] contrast-[1.1]"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent flex flex-col justify-end p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-white mb-4 font-serif">Restore Access</h2>
            <p className="text-lg text-white/80 max-w-md">
              Take a moment to set a strong password to keep your account safe and secure.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side: Reset Password Form */}
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
          <Suspense fallback={<Loader2 className="size-8 animate-spin text-primary" />}>
            <ResetPasswordForm />
          </Suspense>
        </motion.div>

        <div className="mt-auto pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Climax Apparels. All rights reserved.
        </div>
      </div>
    </div>
  );
}

