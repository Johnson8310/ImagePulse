import { Film } from 'lucide-react';

export function ImagePulseLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="p-2 bg-gradient-to-br from-[#FF4081] to-[#FF5722] rounded-lg shadow-md">
        <Film className="text-white h-6 w-6" />
      </div>
      <h1 className="text-xl font-headline font-bold text-foreground">ImagePulse</h1>
    </div>
  );
}
