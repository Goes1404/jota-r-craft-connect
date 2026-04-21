"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

function FloatingPaths({ position }: { position: number }) {
    const paths = Array.from({ length: 36 }, (_, i) => ({
        id: i,
        d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
            380 - i * 5 * position
        } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
            152 - i * 5 * position
        } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
            684 - i * 5 * position
        } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
        // Bright golden hues with varying opacity
        color: `rgba(255, 215, 0, ${0.4 + i * 0.02})`,
        width: 0.5 + i * 0.04,
    }));

    return (
        <div className="absolute inset-0 pointer-events-none">
            <svg
                className="w-full h-full"
                viewBox="0 0 696 316"
                fill="none"
            >
                <title>Background Paths</title>
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke={path.color}
                        strokeWidth={path.width}
                        strokeOpacity={0.1 + path.id * 0.03}
                        initial={{ pathLength: 0.3, opacity: 0.6 }}
                        animate={{
                            pathLength: 1,
                            opacity: [0.3, 0.6, 0.3],
                            pathOffset: [0, 1, 0],
                        }}
                        transition={{
                            duration: 20 + Math.random() * 10,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}

export function BackgroundPaths({
    title = "JR acessorios",
}: {
    title?: string;
}) {
    const words = title.split(" ");

    return (
        <div className="relative min-h-[60vh] md:min-h-[70vh] w-full flex items-center justify-center overflow-hidden bg-background">
            <div className="absolute inset-0 z-0">
                <FloatingPaths position={1} />
                <FloatingPaths position={-1} />
            </div>

            <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                    className="max-w-4xl mx-auto"
                >
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-black mb-6 tracking-tighter flex flex-wrap justify-center items-baseline gap-x-4">
                        {/* "JR" – letter by letter animation */}
                        <span className="inline-flex">
                            {"JR".split("").map((letter, i) => (
                                <motion.span
                                    key={i}
                                    initial={{ y: 80, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{
                                        delay: i * 0.06,
                                        type: "spring",
                                        stiffness: 150,
                                        damping: 25,
                                    }}
                                    className="inline-block text-white drop-shadow-[0_2px_12px_rgba(255,215,0,0.3)]"
                                >
                                    {letter}
                                </motion.span>
                            ))}
                        </span>

                        {/* "acessorios" – whole word animates in as one block */}
                        <motion.span
                            initial={{ y: 80, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{
                                delay: 0.25,
                                type: "spring",
                                stiffness: 120,
                                damping: 22,
                            }}
                            className="inline-block text-primary italic font-light"
                            style={{ textShadow: "0 0 24px rgba(255,215,0,0.4)" }}
                        >
                            acessorios
                        </motion.span>
                    </h1>

                    <p className="text-sm sm:text-base text-white/80 max-w-md mx-auto leading-relaxed font-light mb-8 animate-fade-in">
                        Onde a sofisticação encontra a inovação. Celulares, acessórios premium e gadgets com a exclusividade que você merece.
                    </p>

                    <div
                        className="inline-block group relative bg-gradient-to-b from-primary/20 to-primary/5 p-px rounded-full backdrop-blur-lg overflow-hidden shadow-lg hover:shadow-primary/20 transition-shadow duration-300"
                    >
                        <Link to="/produtos">
                            <Button
                                variant="ghost"
                                className="rounded-full px-8 py-6 text-lg font-semibold backdrop-blur-md bg-background/90 hover:bg-background text-foreground transition-all duration-300 group-hover:-translate-y-0.5 border border-primary/20 hover:shadow-md"
                            >
                                <span className="opacity-90 group-hover:opacity-100 transition-opacity">
                                    Ver Ofertas
                                </span>
                                <span
                                    className="ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-300"
                                >
                                    <ArrowRight className="inline-block h-5 w-5" />
                                </span>
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
