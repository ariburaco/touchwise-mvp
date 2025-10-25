import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Convex Template</h3>
            <p className="text-sm text-muted-foreground">Convex Template</p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-1">
            © {new Date().getFullYear()}
            <Heart className="w-4 h-4 fill-current text-red-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}
