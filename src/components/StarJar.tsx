import { useTrackerStore } from "@/lib/store/userTrackerStore";
import type { Star } from "@/types/tracker";
import { useMemo } from "react";

interface StarJarProps {
  onStarClick: (star: Star) => void;
}

export const StarJar = ({ onStarClick }: StarJarProps) => {
  const starsMap = useTrackerStore((s) => s.stars);
  const stars = Object.values(starsMap || {}).filter((star: { inJar?: boolean }) => star.inJar !== false);
  
  const starPositions = useMemo(() => {
    return stars.map((_, index) => ({
      rotation: Math.floor((index * 137.5) % 360),
      x: ((index * 73) % 80) + 10,
      y: ((index * 97) % 80) + 10
    }));
  }, [stars]);

  return (
    <div className="flex flex-col items-center gap-3 md:gap-4 lg:gap-6">
      {/* Jar Label */}
      <div className="bg-primary text-primary-foreground px-3 py-2 md:px-4 md:py-2 lg:px-5 lg:py-3 pixel-border-sm md:pixel-border text-xs md:text-sm font-bold">
        Stars collected : {stars.length}
      </div>
      
      {/* Pixel Jar Container */}
      <div className="relative w-full max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg aspect-square mt-4 md:mt-8 lg:mt-12">
        {/* Jar Image */}
        <img 
          src={"/assets/jar.png"} 
          alt="Star Jar" 
          className="absolute inset-0 w-full h-full object-contain"
        />
        
        {/* Stars inside jar - Random positions and rotations */}
        <div className="absolute top-[24%] left-1/2 -translate-x-1/2 w-[56%] h-[56%] overflow-hidden px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4">
          {stars.map((star, index) => {
            const starImage = index % 2 === 0 ? "/assets/yellow_star.png" : "/assets/pink_star.png";
            const position = starPositions[index] || { rotation: 0, x: 50, y: 50 };
            
            return (
              <button
                key={star.id || `star-${index}`}
                onClick={() => onStarClick(star as Star)}
                className="absolute w-4 h-4 md:w-6 md:h-6 lg:w-8 lg:h-8 xl:w-10 xl:h-10 hover:scale-125 transition-transform cursor-pointer animate-fade-in"
                style={{
                  animationDelay: `${index * 0.05}s`,
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  transform: `translate(-50%, -50%) rotate(${position.rotation}deg)`,
                }}
                aria-label={`Star for ${star.question || star.questions?.[0] || 'coding question'}`}
              >
                <img 
                  src={starImage} 
                  alt="star" 
                  className="w-full h-full"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
