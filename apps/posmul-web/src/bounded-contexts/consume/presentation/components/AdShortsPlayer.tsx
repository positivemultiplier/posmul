import React, { useState, useRef, useEffect } from "react";
import { X, Play, Pause, Award, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/shared/ui/components/base";

export interface AdData {
    id: string;
    title: string;
    description: string;
    videoUrl: string;
    reward: number;
    duration: number;
}

interface AdShortsPlayerProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (adId: string) => void;
    ads: AdData[];
}

export const AdShortsPlayer: React.FC<AdShortsPlayerProps> = ({
    isOpen,
    onClose,
    onComplete,
    ads
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [progress, setProgress] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const currentAd = ads[currentIndex];

    // Reset state when switching ads
    useEffect(() => {
        setProgress(0);
        setIsCompleted(false);
        setIsPlaying(true);
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(() => setIsPlaying(false));
        }
    }, [currentIndex, isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const interval = setInterval(() => {
            if (videoRef.current && !videoRef.current.paused) {
                const duration = videoRef.current.duration || currentAd?.duration || 1;
                const percent = (videoRef.current.currentTime / duration) * 100;
                setProgress(percent);
                if (percent >= 99 && !isCompleted) { // 99% considered complete
                    setIsCompleted(true);
                    videoRef.current.pause();
                }
            }
        }, 100);
        return () => clearInterval(interval);
    }, [isOpen, isCompleted]);

    const handleNext = () => {
        if (currentIndex < ads.length - 1) setCurrentIndex(prev => prev + 1);
    };

    const handleClaim = () => {
        onComplete(currentAd.id);
        handleNext(); // Auto next for now
    };

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "100%" }}
                className="fixed inset-0 z-50 bg-black flex items-center justify-center p-0 md:p-4"
            >
                <div className="relative w-full h-full md:w-[400px] md:h-[800px] bg-slate-900 md:rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
                    {/* Header Overlay */}
                    <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
                        <div className="text-white">
                            <h3 className="font-bold text-lg drop-shadow-md">{currentAd?.title}</h3>
                            <p className="text-sm text-slate-300 drop-shadow-md">{currentAd?.description}</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-black/40 rounded-full backdrop-blur-md text-white hover:bg-white/20">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Video Layer */}
                    <div className="absolute inset-0 z-0 bg-slate-950 flex items-center" onClick={togglePlay}>
                        {currentAd && (
                            <video
                                ref={videoRef}
                                src={currentAd.videoUrl}
                                className="w-full h-full object-cover"
                                loop={false}
                                playsInline
                                muted={false} // Auto-play policies might require mute initially but user expects sound in shorts
                            />
                        )}
                        {!isPlaying && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Play className="w-16 h-16 text-white/80" />
                            </div>
                        )}
                    </div>

                    {/* Footer / Controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 z-20 bg-gradient-to-t from-black/90 to-transparent pt-20">
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-gray-700/50 rounded-full mb-6 overflow-hidden backdrop-blur-sm">
                            <div
                                className="h-full bg-yellow-400 transition-all duration-100 ease-linear"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        {/* Action Button */}
                        <div className="flex gap-4 items-center">
                            {isCompleted ? (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="w-full"
                                >
                                    <Button
                                        onClick={handleClaim}
                                        className="w-full h-14 text-lg font-bold bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl shadow-lg shadow-yellow-400/20 animate-pulse"
                                    >
                                        <Award className="w-6 h-6 mr-2" />
                                        {currentAd?.reward} PMP 받기
                                    </Button>
                                </motion.div>
                            ) : (
                                <div className="w-full h-14 flex items-center justify-center bg-slate-800/80 backdrop-blur-md rounded-xl text-slate-400 font-medium border border-slate-700">
                                    시청 중... ({Math.floor(progress)}%)
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
