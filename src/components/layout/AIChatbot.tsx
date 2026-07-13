'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Bot, User, Loader2, MessageCircleQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');

  const renderMessageContent = (content: string) => {
    const parts = [];
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const [fullMatch, text, url] = match;
      const matchIndex = match.index;

      if (matchIndex > lastIndex) {
        parts.push(content.substring(lastIndex, matchIndex));
      }

      const isRelative = url.startsWith('/') && !url.startsWith('//');
      const isHttp = url.startsWith('http://') || url.startsWith('https://');
      const isMailto = url.startsWith('mailto:');

      if (!isRelative && !isHttp && !isMailto) {
        parts.push(fullMatch);
      } else {
        const isExternal = isHttp;
        parts.push(
          <Link
            key={matchIndex}
            href={url}
            onClick={() => setIsOpen(false)}
            className="underline text-primary hover:opacity-80 font-bold"
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
          >
            {text}
          </Link>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi there! I am your Climax Apparels AI assistant. How can I help you today?' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Server error: ${response.status}`);
      }

      const data = await response.json();
      if (data.message) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
      } else {
        throw new Error('No message in response');
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting right now. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="relative group"
      >
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white text-black text-[10px] font-bold px-2 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-neutral-100">
          Ask AI Assistant
        </div>
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full shadow-2xl h-10 w-10 md:h-12 md:w-12 bg-primary hover:bg-primary/95 text-primary-foreground border-2 border-white transition-all flex items-center justify-center p-0"
          aria-label="Open AI chat"
        >
          <Bot className="h-7 w-7 md:h-8 md:w-8" />
        </Button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 md:bottom-6 right-6 z-[60] w-[90vw] max-w-[400px] h-[600px] max-h-[80vh] bg-background border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Bot className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Climax Apparels AI</h3>
                  <p className="text-[10px] text-primary-foreground/70">Always active for you</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-primary-foreground hover:bg-white/10"
              >
                <X className="size-5" />
              </Button>
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-hidden bg-muted/30">
              <div
                className="h-full overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
                ref={scrollRef}
              >
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "flex gap-3 max-w-[85%]",
                        msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                      )}
                    >
                      <div className={cn(
                        "size-8 rounded-full flex items-center justify-center shrink-0 border",
                        msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-background text-foreground"
                      )}>
                        {msg.role === 'user' ? <User className="size-4" /> : <Bot className="size-4" />}
                      </div>
                      <div className={cn(
                        "p-3 rounded-2xl text-sm shadow-sm whitespace-pre-line",
                        msg.role === 'user'
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-background text-foreground rounded-tl-none border"
                      )}>
                        {msg.role === 'user' ? msg.content : renderMessageContent(msg.content)}
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 max-w-[85%]">
                      <div className="size-8 rounded-full flex items-center justify-center bg-background border text-foreground">
                        <Bot className="size-4" />
                      </div>
                      <div className="bg-background border p-3 rounded-2xl rounded-tl-none">
                        <Loader2 className="size-4 animate-spin text-primary" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-background">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-muted/50 border-none rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || !input.trim()}
                  className="rounded-full h-10 w-10 shrink-0 shadow-lg shadow-primary/20"
                >
                  <Send className="size-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

