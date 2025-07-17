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
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function GalleryPage() {
  const pathname = usePathname();
  const placeholderVideo =
    'data:video/mp4;base64,AAAAHGZ0eXBNNFYgAAACAGlzb21pc28yYXZjMQAAAAhmcmVlAAAAG21kYXQAAAGzABAHAAABthBgQG//+v34A';

  // Create an array of 6 placeholders
  const galleryItems = Array(6).fill(placeholderVideo);

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

              {galleryItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {galleryItems.map((videoUri, index) => (
                    <Card key={index} className="overflow-hidden shadow-lg">
                      <CardContent className="p-0">
                        <video
                          src={videoUri}
                          controls
                          loop
                          className="aspect-video w-full"
                        />
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
