'use client';

import { useEffect, useRef, useState } from 'react';

// Pixelated shape configurations (16x16 grid patterns)
const shapePatterns = {
  // Gemini pattern
  gemini: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ],
  // GPT pattern
  gpt: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0],
    [0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0],
    [0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0],
    [0, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ],
  // Claude pattern
  claude: [
    [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    [0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1],
    [1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1],
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0]
  ],
  // Grok pattern
  grok: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0],
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    [0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0],
    [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ]
};

export default function AIShapeAnimation() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pixelsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const loadAndAnimate = async () => {
      try {
        const { animate, stagger } = await import('animejs');
        
        if (!containerRef.current) return;

        // Initial animation of pixels
        animate('.pixel', {
          scale: [0, 1],
          opacity: [0, 1],
          delay: stagger(30, { grid: [16, 16], from: 'center' }),
          duration: 1000,
          easing: 'easeOutElastic(1, .8)'
        });

        // Shape morphing animation
        const morphShapes = () => {
          const shapeOrder = ['gemini', 'gpt', 'claude', 'grok'];
          const currentShape = shapeOrder[currentIndex];
          const pattern = shapePatterns[currentShape as keyof typeof shapePatterns];
          
          // Animate pixels based on pattern
          pixelsRef.current.forEach((pixel, index) => {
            if (pixel) {
              const row = Math.floor(index / 16);
              const col = index % 16;
              const shouldShow = pattern[row] && pattern[row][col] === 1;
              
              animate(pixel, {
                scale: shouldShow ? 1 : 0,
                opacity: shouldShow ? 1 : 0.1,
                backgroundColor: shouldShow ? '#000000' : '#f3f4f6',
                duration: 600,
                easing: 'easeInOutQuad',
                delay: Math.random() * 200
              });
            }
          });
        };

        // Initial shape
        setTimeout(morphShapes, 1500);

        // Set up interval for shape changes
        const interval = setInterval(() => {
          setCurrentIndex((prev) => {
            const next = (prev + 1) % 4; // 4 shapes total
            return next;
          });
        }, 3000);

        return () => clearInterval(interval);

      } catch (error) {
        console.error('Failed to load anime.js:', error);
      }
    };

    loadAndAnimate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Trigger shape morph when currentIndex changes
    const loadAndMorph = async () => {
      try {
        const { animate } = await import('animejs');
        
        const shapeOrder = ['gemini', 'gpt', 'claude', 'grok'];
        const currentShape = shapeOrder[currentIndex];
        const pattern = shapePatterns[currentShape as keyof typeof shapePatterns];
        
        // Animate pixels based on pattern
        pixelsRef.current.forEach((pixel, index) => {
          if (pixel) {
            const row = Math.floor(index / 16);
            const col = index % 16;
            const shouldShow = pattern[row] && pattern[row][col] === 1;
            
            animate(pixel, {
              scale: shouldShow ? 1 : 0,
              opacity: shouldShow ? 1 : 0.1,
              backgroundColor: shouldShow ? '#000000' : '#f3f4f6',
              duration: 600,
              easing: 'easeInOutQuad',
              delay: Math.random() * 200
            });
          }
        });
      } catch (error) {
        console.error('Failed to animate:', error);
      }
    };

    if (currentIndex > 0 || pixelsRef.current.length > 0) {
      loadAndMorph();
    }
  }, [currentIndex]);

  return (
    <div 
      ref={containerRef}
      className="flex flex-col items-center justify-center w-full max-w-xs md:max-w-md mx-auto"
    >
      {/* Pixelated shape grid */}
      <div 
        className="mb-2 md:mb-8 p-2 md:p-8 gap-1 md:gap-1"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(16, 1fr)'
        }}
      >
        {Array.from({ length: 256 }, (_, index) => (
          <div
            key={index}
            ref={(el) => {
              if (el) pixelsRef.current[index] = el;
            }}
            className="pixel bg-gray-100 transition-all duration-300 w-2 h-2 md:w-3 md:h-3"
            style={{
              transformOrigin: 'center',
              transform: 'scale(0)'
            }}
          />
        ))}
      </div>

      {/* Message */}
      <div className="text-center">
        <h2 className="text-lg md:text-2xl font-bold text-black mb-2">
          Skip the Giant LLM&apos;s
        </h2>
        <h3 className="text-base md:text-xl font-semibold text-gray-700">
          Save money & data by using droplets
        </h3>
      </div>
    </div>
  );
}
