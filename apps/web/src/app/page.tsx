import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8">
      <main className="flex flex-col items-center gap-8 max-w-4xl text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          Plan Smarter. <span className="text-blue-500">Finish Earlier.</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Aheadly is your AI-powered productivity companion that proactively helps you complete work before deadlines instead of simply reminding you.
        </p>
        <div className="flex gap-4">
          <Button size="lg" className="rounded-full">Get Started</Button>
          <Button size="lg" variant="outline" className="rounded-full">View Dashboard</Button>
        </div>
      </main>
    </div>
  );
}
