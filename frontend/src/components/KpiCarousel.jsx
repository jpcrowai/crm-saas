import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './KpiCarousel.css';

const KpiCarousel = ({ items, autoPlay = true, autoPlayInterval = 6000 }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef(null);

    const next = () => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
    };

    const prev = () => {
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    };

    useEffect(() => {
        if (autoPlay && !isPaused) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(next, autoPlayInterval);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [autoPlay, isPaused, autoPlayInterval, items.length, currentIndex]);

    const handleTouch = () => {
        setIsPaused(true);
        // Auto-resume after 10s of no interaction if paused by touch
        setTimeout(() => setIsPaused(false), 10000);
    };

    if (!items || items.length === 0) return null;

    return (
        <div
            className="kpi-carousel-outer"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouch}
        >
            <div className="kpi-carousel-track-container">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -15 }}
                        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                        className="kpi-carousel-item"
                    >
                        {items[currentIndex]}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="kpi-carousel-footer">
                <div className="carousel-nav-controls">
                    <button onClick={prev} className="carousel-nav-btn" aria-label="Previous">
                        <ChevronLeft size={18} />
                    </button>

                    <div className="carousel-dots">
                        {items.map((_, idx) => (
                            <button
                                key={idx}
                                className={`carousel-dot ${idx === currentIndex ? 'active' : ''}`}
                                onClick={() => setCurrentIndex(idx)}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>

                    <button onClick={next} className="carousel-nav-btn" aria-label="Next">
                        <ChevronRight size={18} />
                    </button>
                </div>

                {autoPlay && (
                    <div className="carousel-progress-track">
                        <motion.div
                            key={`${currentIndex}-${isPaused}`}
                            initial={{ width: 0 }}
                            animate={{ width: isPaused ? '0%' : '100%' }}
                            transition={{
                                duration: isPaused ? 0 : autoPlayInterval / 1000,
                                ease: "linear"
                            }}
                            className="carousel-progress-fill"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default KpiCarousel;
