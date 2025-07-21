'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { ImagePulseLogo } from '@/components/ImagePulseLogo';
import { Header } from '@/components/Header';
import {
  Clapperboard,
  GalleryHorizontal,
  Settings,
  UploadCloud,
  Loader,
  Share2,
  Download,
  X,
  Sparkles,
  PanelLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { generateVideoFromImage } from '@/ai/flows/generate-video-from-image';
import { videoPreviewAndShare } from '@/ai/flows/video-preview-and-share';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';


type AppState = 'idle' | 'describing' | 'generating' | 'finished';

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();


  const handleFileSelect = () => {
    if (!user && !authLoading) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to create a video.',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please upload an image file.',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        setImageUri(dataUri);
        setAppState('describing');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerationStart = async () => {
    if (!imageUri || !user) return;
    setAppState('generating');

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + 5;
      });
    }, 800);

    try {
      const result = await generateVideoFromImage({ 
        photoDataUri: imageUri, 
        description,
        userId: user.uid
      });
      clearInterval(interval);
      setProgress(100);
      if (result.videoDataUri && result.videoDataUri.startsWith('data:video')) {
        setVideoUri(result.videoDataUri);
        setAppState('finished');
      } else {
        throw new Error("The generated file was not a valid video.")
      }
    } catch (error) {
      console.error('Video generation failed:', error);
      clearInterval(interval);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'Something went wrong while creating your video. Please try again.',
      });
      handleReset();
    }
  };


  const handleReset = useCallback(() => {
    setAppState('idle');
    setImageUri(null);
    setVideoUri(null);
    setProgress(0);
    setDescription('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleDownload = () => {
    if (!videoUri) return;
    const link = document.createElement('a');
    link.href = videoUri;
    const extension = 'mp4';
    link.download = `imagepulse-video.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleShare = async () => {
    if (!videoUri) return;

    try {
      const result = await videoPreviewAndShare({ videoDataUri: videoUri });
      if (result.success) {
        toast({
          title: 'Shared Successfully!',
          description: 'Your video has been shared (simulated).',
        });
      } else {
        throw new Error('Sharing failed');
      }
    } catch (error) {
      console.error('Sharing failed:', error);
      toast({
        variant: 'destructive',
        title: 'Sharing Failed',
        description: 'Could not share your video at this time.',
      });
    }
  };
  
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="flex items-center justify-between">
          <ImagePulseLogo />
           <SidebarTrigger className="hidden md:flex" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/">
                <SidebarMenuButton isActive={pathname === '/'} tooltip="Create">
                  <Clapperboard />
                  <span className="group-data-[collapsible=icon]:hidden">Create</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/gallery">
                <SidebarMenuButton isActive={pathname === '/gallery'} tooltip="My Gallery">
                  <GalleryHorizontal />
                  <span className="group-data-[collapsible=icon]:hidden">My Gallery</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Settings">
                <Settings />
                <span className="group-data-[collapsible=icon]:hidden">Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton>
                        <PanelLeft className="rotate-180" />
                        <span className="group-data-[collapsible=icon]:hidden">Collapse</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex h-svh flex-col">
          <Header />
          <main className="flex-1 overflow-auto bg-background p-4 md:p-8">
            <div className="mx-auto h-full max-w-4xl flex items-center justify-center">
              {appState === 'idle' && <IdleView onUploadClick={handleFileSelect} />}
              {appState === 'generating' && <GeneratingView progress={progress} />}
              {appState === 'finished' && <FinishedView videoUri={videoUri} onDownload={handleDownload} onShare={handleShare} onReset={handleReset} />}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            <DescriptionDialog
              open={appState === 'describing'}
              onOpenChange={(isOpen) => {
                if (!isOpen) {
                  handleReset();
                }
              }}
              description={description}
              onDescriptionChange={setDescription}
              onSubmit={handleGenerationStart}
            />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

const IdleView = ({ onUploadClick }: { onUploadClick: () => void }) => (
  <div className="text-center">
    <Card className="mx-auto max-w-lg shadow-lg border-2 border-dashed border-primary/20 hover:border-primary/50 transition-all duration-300">
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="rounded-full border-8 border-secondary p-6">
            <Sparkles className="h-16 w-16 text-primary" strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold font-headline">Bring Your Images to Life</h2>
            <p className="text-muted-foreground">
              Upload a static image and our AI will generate a short, subtly animated video clip.
            </p>
          </div>
          <Button size="lg" onClick={onUploadClick}>
            <UploadCloud className="mr-2 h-5 w-5" />
            Upload Image
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

const GeneratingView = ({ progress }: { progress: number }) => (
  <div className="flex flex-col items-center justify-center space-y-6 text-center">
    <h2 className="text-3xl font-bold font-headline">Generating your masterpiece...</h2>
    <p className="text-muted-foreground">Our creative AI is adding its magic touch. This might take a moment.</p>
    <div className="w-full max-w-md space-y-4">
      <Loader className="mx-auto h-12 w-12 animate-spin text-primary" />
      <Progress value={progress} className="w-full" />
      <p className="text-sm font-medium text-primary">{Math.round(progress)}%</p>
    </div>
  </div>
);

const FinishedView = ({ videoUri, onDownload, onShare, onReset }: { videoUri: string | null; onDownload: () => void; onShare: () => void; onReset: () => void }) => (
  <div className="space-y-6 w-full">
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <h2 className="text-3xl font-bold font-headline">Your Video is Ready!</h2>
      <Button variant="outline" onClick={onReset}>
        <X className="mr-2 h-4 w-4" />
        Start Over
      </Button>
    </div>
    <Card className="overflow-hidden shadow-lg">
      <CardContent className="p-0">
        {videoUri ? (
          <video src={videoUri} controls autoPlay loop className="aspect-video w-full" />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-muted">
            <p>Could not load video.</p>
          </div>
        )}
      </CardContent>
    </Card>
    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
      <Button size="lg" onClick={onDownload} className="w-full sm:w-auto">
        <Download className="mr-2 h-5 w-5" />
        Download
      </Button>
      <Button size="lg" variant="secondary" onClick={onShare} className="w-full sm:w-auto">
        <Share2 className="mr-2 h-5 w-5" />
        Share
      </Button>
    </div>
  </div>
);

interface DescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  onSubmit: () => void;
}

const DescriptionDialog: React.FC<DescriptionDialogProps> = ({
  open,
  onOpenChange,
  description,
  onDescriptionChange,
  onSubmit,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Describe your vision</DialogTitle>
          <DialogDescription>
            Tell the AI what kind of animation you want. Be as descriptive as you like!
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="e.g., 'Make the clouds move slowly from left to right, and make the water ripple gently.'"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSubmit}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Video
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
