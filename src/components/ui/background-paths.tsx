import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface FloatingPathsProps {
    position: number;
}

function FloatingPaths({ position }: FloatingPathsProps) {
    const gradientId = position === 1 ? "gold-glow-grad" : "purple-glow-grad";
    
    // Spaced out curves to span the entire screen elegantly instead of crowding on one side
    const paths = Array.from({ length: 16 }, (_, i) => {
        const startX = -200;
        // Distribute start and end heights widely (from 80px to 480px)
        const startY = position === 1 ? (60 + i * 28) : (540 - i * 28);
        
        // Control points that create an organic "pinch" (narrowing) in the center of the viewport
        const cp1X = position === 1 ? (280 + i * 18) : (320 - i * 18);
        const cp1Y = position === 1 ? (40 + i * 12) : (560 - i * 12);
        
        const cp2X = position === 1 ? (920 - i * 18) : (880 + i * 18);
        const cp2Y = position === 1 ? (560 - i * 12) : (40 + i * 12);
        
        const endX = 1400;
        const endY = position === 1 ? (280 + i * 28) : (320 - i * 28);
        
        return {
            id: i,
            d: `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`,
            width: 0.8 + (i * 0.08),
        };
    });

    return (
        <div className="absolute inset-0 pointer-events-none">
            <svg
                className="w-full h-full opacity-60"
                viewBox="0 0 1200 600"
                fill="none"
                preserveAspectRatio="xMidYMid slice"
            >
                <title>Background Paths</title>
                <defs>
                    {/* Gold Premium Gradient */}
                    {position === 1 ? (
                        <linearGradient 
                            id="gold-glow-grad" 
                            gradientUnits="userSpaceOnUse" 
                            x1="-200" 
                            y1="100" 
                            x2="1400" 
                            y2="500"
                        >
                            <stop offset="0%" stopColor="#d4af37" stopOpacity={0} />
                            <stop offset="15%" stopColor="#d4af37" stopOpacity={0.5} />
                            <stop offset="50%" stopColor="#fff5d6" stopOpacity={0.8} />
                            <stop offset="85%" stopColor="#d4af37" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
                        </linearGradient>
                    ) : (
                        /* Purple Premium Gradient */
                        <linearGradient 
                            id="purple-glow-grad" 
                            gradientUnits="userSpaceOnUse" 
                            x1="-200" 
                            y1="500" 
                            x2="1400" 
                            y2="100"
                        >
                            <stop offset="0%" stopColor="#a484d7" stopOpacity={0} />
                            <stop offset="15%" stopColor="#a484d7" stopOpacity={0.4} />
                            <stop offset="50%" stopColor="#c3b0ea" stopOpacity={0.7} />
                            <stop offset="85%" stopColor="#8a63d2" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#8a63d2" stopOpacity={0} />
                        </linearGradient>
                    )}
                    
                    {/* SVG filter for the premium gold-purple glowing aura effect */}
                    <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3.5" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke={`url(#${gradientId})`}
                        strokeWidth={path.width}
                        strokeLinecap="round"
                        filter="url(#glow-filter)"
                        initial={{ pathLength: 0.1, opacity: 0.1 }}
                        animate={{
                            pathLength: [0.15, 0.75, 0.15],
                            opacity: [0.2, 0.65, 0.2],
                            pathOffset: [0, 1.2],
                        }}
                        transition={{
                            duration: 20 + Math.random() * 15,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}

export function BackgroundPaths({
    title = "Background Paths",
    onlyBackground = false,
}: {
    title?: string;
    onlyBackground?: boolean;
}) {
    if (onlyBackground) {
        return (
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                {/* Dark Luxury Ambient Radial Glows */}
                <div className="absolute top-[-25%] right-[-10%] w-[70vw] h-[70vw] max-w-[800px] max-h-[800px] rounded-full bg-[#d4af37]/10 blur-[140px] pointer-events-none animate-pulse duration-[8000ms] mix-blend-screen" />
                <div className="absolute bottom-[10%] left-[-15%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-full bg-[#a484d7]/08 blur-[120px] pointer-events-none mix-blend-screen" />
                <div className="absolute top-[35%] right-[15%] w-[45vw] h-[45vw] max-w-[500px] max-h-[500px] rounded-full bg-[#d4af37]/05 blur-[100px] pointer-events-none mix-blend-screen animate-pulse duration-[12000ms]" />

                <FloatingPaths position={1} />
                <FloatingPaths position={-1} />
            </div>
        );
    }

    const words = title.split(" ");

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-white dark:bg-neutral-950">
            <div className="absolute inset-0">
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
                    <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold mb-8 tracking-tighter">
                        {words.map((word, wordIndex) => (
                            <span
                                key={wordIndex}
                                className="inline-block mr-4 last:mr-0"
                            >
                                {word.split("").map((letter, letterIndex) => (
                                    <motion.span
                                        key={`${wordIndex}-${letterIndex}`}
                                        initial={{ y: 100, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{
                                            delay:
                                                wordIndex * 0.1 +
                                                letterIndex * 0.03,
                                            type: "spring",
                                            stiffness: 150,
                                            damping: 25,
                                        }}
                                        className="inline-block text-transparent bg-clip-text 
                                        bg-gradient-to-r from-neutral-900 to-neutral-700/80 
                                        dark:from-white dark:to-white/80"
                                    >
                                        {letter}
                                    </motion.span>
                                ))}
                            </span>
                        ))}
                    </h1>

                    <div
                        className="inline-block group relative bg-gradient-to-b from-black/10 to-white/10 
                        dark:from-white/10 dark:to-black/10 p-px rounded-2xl backdrop-blur-lg 
                        overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                    >
                        <Button
                            variant="ghost"
                            className="rounded-[1.15rem] px-8 py-6 text-lg font-semibold backdrop-blur-md 
                            bg-white/95 hover:bg-white/100 dark:bg-black/95 dark:hover:bg-black/100 
                            text-black dark:text-white transition-all duration-300 
                            group-hover:-translate-y-0.5 border border-black/10 dark:border-white/10
                            hover:shadow-md dark:hover:shadow-neutral-800/50"
                        >
                            <span className="opacity-90 group-hover:opacity-100 transition-opacity">
                                Discover Excellence
                            </span>
                            <span
                                className="ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 
                                transition-all duration-300"
                            >
                                →
                            </span>
                        </Button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
