'use client';

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
  PanelLeft,
  Loader,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getVideosForUser, Video } from '@/services/video-service';

export default function GalleryPage() {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Redirect to login or show message if not authenticated
      setLoading(false);
      return;
    }

    const fetchVideos = async () => {
      try {
        setLoading(true);
        const userVideos = await getVideosForUser(user.uid);
        setVideos(userVideos);
      } catch (error) {
        console.error('Failed to fetch videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [user, authLoading]);

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
                  <span className="group-data-[collapsible=icon]:hidden">
                    Create
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/gallery">
                <SidebarMenuButton
                  isActive={pathname === '/gallery'}
                  tooltip="My Gallery"
                >
                  <GalleryHorizontal />
                  <span className="group-data-[collapsible=icon]:hidden">
                    My Gallery
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Settings">
                <Settings />
                <span className="group-data-[collapsible=icon]:hidden">
                  Settings
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <PanelLeft className="rotate-180" />
                <span className="group-data-[collapsible=icon]:hidden">
                  Collapse
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex h-svh flex-col">
          <Header />
          <main className="flex-1 overflow-auto bg-background p-4 md:p-8">
            <div className="mx-auto max-w-7xl">
              <div className="mb-8 flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">
                  My Gallery
                </h1>
                <Link href="/">
                  <Button>Create New Video</Button>
                </Link>
              </div>

              {loading || authLoading ? (
                 <div className="flex justify-center items-center py-20">
                    <Loader className="h-12 w-12 animate-spin text-primary" />
                 </div>
              ) : videos.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {videos.map((video) => (
                    <Card key={video.id} className="overflow-hidden shadow-lg group">
                      <CardContent className="p-0 relative">
                        <video
                          src={video.videoUri}
                          controls
                          loop
                          className="aspect-video w-full"
                        />
                         <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <p className="text-white text-sm truncate">{video.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/20 py-20 text-center">
                  <GalleryHorizontal className="h-16 w-16 text-muted-foreground" />
                  <h2 className="mt-6 text-xl font-semibold">
                    Your gallery is empty
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    Create a video to see it here.
                  </p>
                  <Link href="/" className="mt-6">
                    <Button>Generate Your First Video</Button>
                  </Link>
                </div>
              )}
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}