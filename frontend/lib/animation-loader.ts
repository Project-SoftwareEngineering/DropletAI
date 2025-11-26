// Animation library loader with caching
let animeInstance: typeof import('animejs') | null = null;
let motionInstance: typeof import('motion/react') | null = null;

export const loadAnime = async () => {
  if (animeInstance) return animeInstance;
  
  try {
    animeInstance = await import('animejs');
    return animeInstance;
  } catch (error) {
    console.error('Failed to load anime.js:', error);
    throw error;
  }
};

export const loadMotion = async () => {
  if (motionInstance) return motionInstance;
  
  try {
    motionInstance = await import('motion/react');
    return motionInstance;
  } catch (error) {
    console.error('Failed to load motion:', error);
    throw error;
  }
};

// Preload animations on user interaction
export const preloadAnimations = () => {
  if (typeof window !== 'undefined') {
    // Preload on user interaction
    const preload = () => {
      loadAnime();
      loadMotion();
    };
    
    document.addEventListener('mousemove', preload, { once: true });
    document.addEventListener('touchstart', preload, { once: true });
    document.addEventListener('scroll', preload, { once: true });
  }
};