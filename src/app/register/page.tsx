'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, GalleryVerticalEnd, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { divisions, bdDivisions, bdLocations } from '@/lib/bd-locations';
import { Logo } from '@/components/ui/logo';

const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string().min(11, { message: 'Enter a valid mobile number' }),
  address: z.string().min(5, { message: 'Address is required' }),
  division: z.string().min(1, { message: 'Division is required' }),
  district: z.string().min(1, { message: 'District is required' }),
  thana: z.string().min(1, { message: 'Thana is required' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string().min(1, { message: 'Confirm your password' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      division: '',
      district: '',
      thana: '',
      password: '',
      confirmPassword: '',
    },
  });

  const selectedDivision = form.watch('division');
  const selectedDistrict = form.watch('district');

  const availableDistricts = selectedDivision ? bdDivisions[selectedDivision] : [];
  const availableThanas = selectedDistrict ? bdLocations[selectedDistrict] : [];

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || 'Server returned a non-JSON response');
      }

      if (!response.ok) {
        toast.error(data.message || 'Registration failed');
      } else {
        toast.success('Registered successfully! Please log in.');
        router.push('/login');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function loginWithGoogle() {
    setIsGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (error) {
      setIsGoogleLoading(false);
      toast.error('Failed to log in with Google.');
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
          src="/assets/register_banner_v2.webp"
          alt="Register Banner"
          fill
          priority
          className="absolute inset-0 h-full w-full object-cover brightness-[0.8] contrast-[1.1]"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent flex flex-col justify-end p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-white mb-4 font-serif">Join Our Community</h2>
            <p className="text-lg text-white/80 max-w-md">
              Create an account today to enjoy a personalized shopping experience and exclusive member benefits.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side: Register Form */}
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
          <div className="w-full max-w-lg space-y-8 py-8">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
              <p className="text-sm text-muted-foreground">
                Join us today and start your shopping journey
              </p>
            </div>

            <div className="grid gap-6">
              <Button
                variant="outline"
                className="w-full h-11 transition-all hover:bg-muted/50 hover:border-primary/50 group"
                onClick={loginWithGoogle}
                disabled={isGoogleLoading || isLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg
                    className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 488 512"
                  >
                    <path
                      fill="currentColor"
                      d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                    ></path>
                  </svg>
                )}
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-4 text-muted-foreground">
                    Or register with details
                  </span>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} disabled={isLoading} className="h-11 focus-visible:ring-primary/20" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Number</FormLabel>
                          <FormControl>
                            <Input placeholder="017XXXXXXXX" {...field} disabled={isLoading} className="h-11 focus-visible:ring-primary/20" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="john@example.com" type="email" {...field} disabled={isLoading} className="h-11 focus-visible:ring-primary/20" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line</FormLabel>
                        <FormControl>
                          <Input placeholder="House #, Road #, Area" {...field} disabled={isLoading} className="h-11 focus-visible:ring-primary/20" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="division"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Division</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              form.setValue('district', '');
                              form.setValue('thana', '');
                            }}
                            value={field.value}
                            disabled={isLoading}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 focus:ring-primary/20">
                                <SelectValue placeholder="Select division" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {divisions.map((division) => (
                                <SelectItem key={division} value={division}>
                                  {division}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="district"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>District</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              form.setValue('thana', '');
                            }}
                            value={field.value}
                            disabled={!selectedDivision || isLoading}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 focus:ring-primary/20">
                                <SelectValue placeholder="Select district" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableDistricts?.map((district) => (
                                <SelectItem key={district} value={district}>
                                  {district}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="thana"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Thana</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!selectedDistrict || isLoading}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 focus:ring-primary/20">
                                <SelectValue placeholder="Select thana" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableThanas?.map((thana) => (
                                <SelectItem key={thana} value={thana}>
                                  {thana}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="••••••••"
                              type={showPassword ? "text" : "password"}
                              {...field}
                              disabled={isLoading}
                              className="h-11 focus-visible:ring-primary/20 pr-10"
                            />
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="••••••••"
                              type={showConfirmPassword ? "text" : "password"}
                              {...field}
                              disabled={isLoading}
                              className="h-11 focus-visible:ring-primary/20 pr-10"
                            />
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] mt-6"
                    disabled={isLoading || isGoogleLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <span className="flex items-center justify-center">
                        Create Account <ArrowRight className="ml-2 h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </Form>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline underline-offset-4">
                Log in instead
              </Link>
            </div>
          </div>
        </motion.div>

        <div className="mt-auto pt-6 text-center text-xs text-muted-foreground">
          By clicking register, you agree to our{' '}
          <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </Link>.
        </div>
      </div>
    </div>
  );
}

