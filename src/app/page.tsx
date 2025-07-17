'use client';

import { useState, useRef, useCallback } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { generateVideoFromImage } from '@/ai/flows/generate-video-from-image';

type AppState = 'idle' | 'generating' | 'finished';

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = () => {
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
      reader.onload = async (e) => {
        const dataUri = e.target?.result as string;
        setImageUri(dataUri);
        setAppState('generating');
        
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 95) {
              clearInterval(interval);
              return prev;
            }
            return prev + 5;
          });
        }, 200);

        try {
          const result = await generateVideoFromImage({ photoDataUri: dataUri });
          clearInterval(interval);
          setProgress(100);
          if (result.videoDataUri && result.videoDataUri.startsWith('data:video')) {
            setVideoUri(result.videoDataUri);
            setAppState('finished');
          } else {
            // A tiny, valid mp4 file as a base64 string
            const fallbackVideo = "data:video/mp4;base64,AAAAHGZ0eXBNNFYgAAACAGlzb21pc28yYXZjMQAAAAhmcmVlAAAAG21kYXQAAAGzABAHAAABthBgQG//+v34A";
            setVideoUri(fallbackVideo);
            setAppState('finished');
            toast({
              title: "Using Placeholder Video",
              description: "The AI model couldn't generate a video, so we're showing a placeholder.",
            });
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
      reader.readAsDataURL(file);
    }
  };

  const handleReset = useCallback(() => {
    setAppState('idle');
    setImageUri(null);
    setVideoUri(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleDownload = () => {
    if (!videoUri) return;
    const link = document.createElement('a');
    link.href = videoUri;
    link.download = 'imagepulse-video.mp4';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <ImagePulseLogo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive tooltip="Create">
                <Clapperboard />
                <span className="group-data-[collapsible=icon]:hidden">Create</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="My Gallery">
                <GalleryHorizontal />
                <span className="group-data-[collapsible=icon]:hidden">My Gallery</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Settings">
                <Settings />
                <span className="group-data-[collapsible=icon]:hidden">Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex h-svh flex-col">
          <Header />
          <main className="flex-1 overflow-auto bg-background p-4 md:p-8">
            <div className="mx-auto h-full max-w-4xl flex items-center justify-center">
              {appState === 'idle' && <IdleView onUploadClick={handleFileSelect} />}
              {appState === 'generating' && <GeneratingView progress={progress} />}
              {appState === 'finished' && <FinishedView videoUri={videoUri} onDownload={handleDownload} onReset={handleReset} />}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
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
          <Button size="lg" className="bg-gradient-to-r from-[#FF4081] to-[#FF5722] text-white font-bold shadow-lg hover:shadow-xl transition-shadow" onClick={onUploadClick}>
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

const FinishedView = ({ videoUri, onDownload, onReset }: { videoUri: string | null; onDownload: () => void; onReset: () => void }) => (
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
      <Button size="lg" onClick={onDownload} className="w-full sm:w-auto bg-gradient-to-r from-[#FF4081] to-[#FF5722] text-white font-bold shadow-lg hover:shadow-xl transition-shadow">
        <Download className="mr-2 h-5 w-5" />
        Download
      </Button>
      <Button size="lg" variant="secondary" className="w-full sm:w-auto">
        <Share2 className="mr-2 h-5 w-5" />
        Share
      </Button>
    </div>
  </div>
);
