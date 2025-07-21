'use client';

import { ImagePulseLogo } from '@/components/ImagePulseLogo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

// Simple SVG for Google icon
const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-67.4 64.8C334.6 112.3 295.6 96 248 96c-88.8 0-160.1 71.1-160.1 160.1s71.4 160.1 160.1 160.1c98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path>
    </svg>
);

export default function LoginPage() {
  const { user, signInWithGoogle, signInWithEmailAndPassword, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      router.push('/');
    } catch (error: any) {
        toast({
            title: 'Sign In Failed',
            description: error.message || 'An unexpected error occurred.',
            variant: 'destructive',
          });
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(email, password);
      router.push('/');
    } catch (error: any) {
      toast({
        title: 'Sign In Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
                <ImagePulseLogo />
            </div>
          <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
          <CardDescription>Sign in to continue to ImagePulse</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Signing In...' : 'Sign In'}
                </Button>
            </form>
            <div className="my-4 flex items-center">
                <div className="flex-grow border-t border-muted-foreground"></div>
                <span className="mx-4 flex-shrink text-xs uppercase text-muted-foreground">Or</span>
                <div className="flex-grow border-t border-muted-foreground"></div>
            </div>
          <Button 
            variant="outline"
            className="w-full" 
            onClick={handleGoogleSignIn} 
            disabled={loading}
          >
            <GoogleIcon />
            {loading ? 'Signing In...' : 'Sign in with Google'}
          </Button>
        </CardContent>
        <CardFooter className="justify-center text-sm">
            <p>Don't have an account? <Link href="/signup" className="font-semibold text-primary underline-offset-4 hover:underline">Sign up</Link></p>
        </CardFooter>
      </Card>
    </div>
  );
}
