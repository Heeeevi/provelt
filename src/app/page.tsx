import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LOGO_URL, APP_NAME, APP_TAGLINE } from '@/lib/constants';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-dark">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-500/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-accent-500/10 via-transparent to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden shadow-2xl shadow-brand-500/20 ring-2 ring-brand-500/30">
                <Image
                  src={LOGO_URL}
                  alt={`${APP_NAME} Logo`}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
            
            {/* App Name */}
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight">
              <span className="gradient-text">PROVE</span>
              <span className="text-white">LT</span>
            </h1>
            
            {/* Tagline */}
            <p className="mt-6 text-xl sm:text-2xl text-surface-300 max-w-2xl mx-auto">
              Prove your skills. Earn your badges. Build your on-chain reputation.
            </p>
            
            {/* Description */}
            <p className="mt-4 text-surface-400 max-w-xl mx-auto">
              Complete daily skill challenges, upload your proof, and mint compressed NFT badges on Solana. 
              Join a community of builders and learners.
            </p>
            
            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/feed">
                <Button size="lg" className="w-full sm:w-auto">
                  Explore Challenges
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Feature Cards */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              emoji="🎯"
              title="Daily Challenges"
              description="New skill challenges every day across coding, design, fitness, and more."
            />
            <FeatureCard
              emoji="🏆"
              title="NFT Badges"
              description="Mint compressed NFTs on Solana as proof of your achievements."
            />
            <FeatureCard
              emoji="🌐"
              title="Community Feed"
              description="Discover what others are proving in a TikTok-style infinite scroll."
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ 
  emoji, 
  title, 
  description 
}: { 
  emoji: string; 
  title: string; 
  description: string;
}) {
  return (
    <div className="card card-hover">
      <div className="text-4xl mb-4">{emoji}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-surface-400">{description}</p>
    </div>
  );
}
