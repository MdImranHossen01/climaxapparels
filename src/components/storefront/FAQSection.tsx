'use client';

import { Badge } from "@/components/ui/badge";
import { HelpCircle, ArrowRight, MessageCircle } from "lucide-react";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import AnimatedList from "../bits/AnimatedList";
import faqAnimation from "../../../public/assets/ecomfaq.json";

// Dynamic import for Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

interface FAQItem {
    question: string;
    answer: string;
}

export function FAQSection({ faqs }: { faqs: FAQItem[] }) {
    if (!faqs || faqs.length === 0) return null;

    return (
        <section className="py-12 md:py-20 relative overflow-hidden bg-muted/20">


            <div className="container mx-auto px-4 md:px-0 relative z-10">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row items-center md:items-end justify-between mb-16 gap-6">
                    <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
                        <h2 className="text-2xl md:text-4xl font-black tracking-tighter">
                            Got Questions? We've Got <span className="text-primary italic">Answers</span>
                        </h2>
                    </div>

                </div>

                <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
                    {/* Left Side: Animation */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, x: -30 }}
                        whileInView={{ opacity: 1, scale: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className="lg:col-span-5 relative group"
                    >
                        <div className="relative z-10 rounded-2xl p-4 md:p-8 overflow-hidden">
                            <Lottie
                                animationData={faqAnimation}
                                loop={true}
                                className="w-full h-auto drop-shadow-[0_20px_50px_rgba(var(--primary-rgb),0.2)]"
                            />
                        </div>

                        {/* Decorative floating elements */}
                        <motion.div
                            animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-6 -right-6 bg-background p-5 rounded-2xl shadow-xl border border-primary/10 hidden md:flex items-center gap-3 z-20"
                        >
                            <div className="bg-primary/10 p-2 rounded-xl text-primary">
                                <MessageCircle className="h-6 w-6" />
                            </div>
                            <div className="pr-4">
                                <p className="text-[10px] font-black uppercase text-muted-foreground leading-none mb-1">Live Chat</p>
                                <p className="text-sm font-bold whitespace-nowrap text-foreground">Always Online</p>
                            </div>
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute -bottom-8 -left-8 bg-background p-5 rounded-2xl shadow-xl border border-primary/10 hidden md:flex items-center gap-3 z-20"
                        >
                            <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-600">
                                <HelpCircle className="h-6 w-6" />
                            </div>
                            <div className="pr-4">
                                <p className="text-[10px] font-black uppercase text-muted-foreground leading-none mb-1">Instant Help</p>
                                <p className="text-sm font-bold whitespace-nowrap text-foreground">Smart FAQ System</p>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Right Side: Animated List */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
                        className="lg:col-span-7"
                    >
                        <AnimatedList
                            items={faqs}
                            className="bg-transparent"
                            itemClassName="!bg-white/40 !backdrop-blur-md"
                            showGradients={false}
                        />


                    </motion.div>
                </div>
            </div>
        </section>
    );
}

