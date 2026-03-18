'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Rocket, Briefcase, GraduationCap, Bot, Smile } from 'lucide-react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';

interface CategoryButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  delay: number;
}

function CategoryButton({
  icon: Icon,
  label,
  onClick,
  delay,
}: CategoryButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Button
        variant="secondary"
        className="h-auto flex-col p-4 text-center bg-secondary/50 hover:bg-secondary/80 transition-all duration-300 hover:scale-105 border border-border/40 hover:border-border/60"
        onClick={onClick}
      >
        <Icon className="size-6 mb-2" />
        <div className="text-sm font-medium">{label}</div>
      </Button>
    </motion.div>
  );
}

export function PortfolioHeader({
  sendMessage,
}: {
  sendMessage?: UseChatHelpers<ChatMessage>['sendMessage'];
}) {
  const handleCategoryClick = (category: string) => {
    // Define specific prompts for each category
    const prompts = {
      projects: 'Tell me about your projects',
      experience: "What's your professional experience?",
      education: 'Tell me about your educational background',
      aitech: 'What are your thoughts on AI and technology?',
    };

    // Send the message if sendMessage function is available
    if (sendMessage) {
      const prompt = prompts[category as keyof typeof prompts];
      sendMessage({
        role: 'user' as const,
        parts: [{ type: 'text', text: prompt }],
      });
    } else {
      // Fallback - just log for now
      console.log(`Selected category: ${category}`);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto text-center space-y-6 py-8">
      {/* Profile Image */}
      <motion.div
        className="flex justify-center mb-6"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring', bounce: 0.3 }}
      >
        <div className="relative size-32 rounded-full overflow-hidden ring-4 ring-primary/20 shadow-xl">
          <Image
            src="/images/me.jpg"
            alt="Deepratna Awale"
            fill
            className="object-cover"
            priority
          />
        </div>
      </motion.div>

      {/* Name - Big and Wide */}
      <motion.h1
        className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-wide"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        Deepratna Awale
      </motion.h1>

      {/* Designation and Location */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <p className="text-xl md:text-2xl text-muted-foreground font-medium">
          Generative AI & Machine Learning Engineer
        </p>
        <p className="text-lg md:text-xl text-muted-foreground flex items-center justify-center gap-2">
          <span className="inline-block size-2 bg-green-500 rounded-full animate-pulse" />
          St. John&apos;s, Newfoundland and Labrador, Canada
        </p>
      </motion.div>

      {/* Animated Subheading */}
      <motion.div
        className="pt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <h2 className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-primary via-purple-500 to-primary bg-size-200 bg-pos-0 animate-shine bg-clip-text text-transparent">
          LLM Powered Portfolio
        </h2>
      </motion.div>

      {/* Brief Introduction */}
      <motion.div
        className="max-w-2xl mx-auto pt-6 space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <p className="text-lg text-muted-foreground leading-relaxed">
          Welcome to my interactive portfolio!
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          <CategoryButton
            icon={Rocket}
            label="Projects"
            onClick={() => handleCategoryClick('projects')}
            delay={1.0}
          />
          <CategoryButton
            icon={Briefcase}
            label="Experience"
            onClick={() => handleCategoryClick('experience')}
            delay={1.1}
          />
          <CategoryButton
            icon={GraduationCap}
            label="Education"
            onClick={() => handleCategoryClick('education')}
            delay={1.2}
          />
          <CategoryButton
            icon={Bot}
            label="AI & Tech"
            onClick={() => handleCategoryClick('aitech')}
            delay={1.3}
          />
        </div>

        <motion.p
          className="text-base text-muted-foreground pt-4 flex items-center justify-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
        >
          What would you like to know about me? Ask away!{' '}
          <Smile className="size-4 inline" />
        </motion.p>
      </motion.div>
    </div>
  );
}
