import { FadeIn } from '../components/ui/AnimatedPage.jsx';
import { Card, CardContent } from '@/components/ui/card';
import { History, Construction, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function HistoryPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] p-6 lg:p-8 flex items-center justify-center">
      <FadeIn className="w-full max-w-2xl">
        <Card className="border-border/40 bg-background/60 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-indigo-500/5 opacity-50 pointer-events-none" />
          
          <CardContent className="p-12 text-center relative z-10 flex flex-col items-center">
            <div className="relative mb-8 group-hover:-translate-y-2 transition-transform duration-500">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-violet-500 to-indigo-500 p-[1px] shadow-2xl shadow-violet-500/20">
                <div className="w-full h-full bg-background/90 backdrop-blur-sm rounded-3xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-indigo-500/10" />
                  <History className="w-12 h-12 text-violet-400" />
                </div>
              </div>
              <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-xl bg-amber-500/20 backdrop-blur-md border border-amber-500/30 flex items-center justify-center animate-bounce shadow-lg shadow-amber-500/20">
                <Construction className="w-5 h-5 text-amber-500" />
              </div>
            </div>

            <Badge variant="outline" className="mb-6 bg-amber-500/10 text-amber-500 border-amber-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-sm">
              In Development
            </Badge>

            <h2 className="text-3xl font-black font-display tracking-tight text-foreground mb-4">
              Analysis History
            </h2>
            
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed mb-10 text-base">
              We're currently completely redesigning the history experience. 
              Soon, you'll be able to compare previous scans, track bug metrics over time, and export beautiful PDF reports.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-sm">
              <Button asChild className="w-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/20">
                <Link to="/dashboard">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start New Analysis
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}