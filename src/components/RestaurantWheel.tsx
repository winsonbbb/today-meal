// src/components/RestaurantWheel.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Restaurant } from '../types';

interface RestaurantWheelProps {
  restaurants: Restaurant[];
  onSpinComplete: (selectedRestaurant: Restaurant) => void;
  isSpinning: boolean; // Prop from App.tsx, primarily for UI control in App.tsx
  triggerSpin: boolean;
}

const RestaurantWheel: React.FC<RestaurantWheelProps> = ({
  restaurants,
  onSpinComplete,
  isSpinning, // We won't use this directly to gate the spin animation start, triggerSpin is the command.
  triggerSpin,
}) => {
  const wheelRef = useRef<HTMLUListElement>(null);
  const [selectedRestaurantIndex, setSelectedRestaurantIndex] = useState<number | null>(null);
  const [isInternallySpinning, setIsInternallySpinning] = useState(false); // Internal state to prevent re-triggering animation

  const segmentAngle = 360 / (restaurants.length || 1);

  useEffect(() => {
    // Spin if commanded (triggerSpin), not already spinning internally, and there are restaurants.
    if (triggerSpin && !isInternallySpinning && restaurants.length > 0) {
      setIsInternallySpinning(true); // Mark that the wheel is now processing a spin

      const randomIndex = Math.floor(Math.random() * restaurants.length);
      setSelectedRestaurantIndex(randomIndex);

      const targetAngle = 360 * 5 - randomIndex * segmentAngle + segmentAngle / 2;

      if (wheelRef.current) {
        wheelRef.current.style.transition = 'transform 4s ease-out';
        wheelRef.current.style.transform = `rotate(${targetAngle}deg)`;
      }

      setTimeout(() => {
        onSpinComplete(restaurants[randomIndex]);
        if (wheelRef.current) {
          wheelRef.current.style.transition = 'none';
          const finalAngle = targetAngle % 360;
          wheelRef.current.style.transform = `rotate(${finalAngle}deg)`;
        }
        setIsInternallySpinning(false); // Reset internal spinning state
      }, 4000);
    } else if (!triggerSpin && isInternallySpinning) {
      // If triggerSpin becomes false while internally spinning (e.g. parent component reset it),
      // we might want to ensure the internal state is also reset, though App.tsx handles this.
      // For now, the main logic is driven by triggerSpin becoming true.
    }
  }, [triggerSpin, restaurants, onSpinComplete, segmentAngle]); // REMOVED isInternallySpinning from deps

  if (restaurants.length === 0) {
    return <div className="text-center p-4">Add some restaurants to spin the wheel!</div>;
  }

  return (
    <div className="flex flex-col items-center my-8">
      <div className="relative w-80 h-80 border-4 border-gray-700 rounded-full overflow-hidden shadow-xl">
        {/* Pointer */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 z-10"
          style={{
            width: 0,
            height: 0,
            borderLeft: '15px solid transparent',
            borderRight: '15px solid transparent',
            borderTop: '25px solid red', // Pointer color
          }}
        />
        <ul
          ref={wheelRef}
          className="absolute w-full h-full rounded-full"
          style={{
            transformOrigin: 'center center',
            transition: 'transform 4s ease-out',
          }}
        >
          {restaurants.map((restaurant, index) => {
            const angle = segmentAngle * index;
            const itemAngle = segmentAngle;
            const bgColor = index % 2 === 0 ? 'bg-blue-400' : 'bg-blue-500';

            return (
              <li
                key={restaurant.id}
                className={`absolute w-1/2 h-1/2 ${bgColor} text-white flex items-center justify-center origin-bottom-right`}
                style={{
                  transform: `rotate(${angle}deg) skewY(${Math.max(-60, itemAngle - 90)}deg)`,
                  clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
                  left: '50%',
                  top: '50%',
                  marginLeft: '-0.5px',
                  marginTop: '-0.5px',
                }}
              >
                <span
                  className="block w-full text-center text-xs sm:text-sm font-bold p-1 break-words"
                  style={{
                    transform: `skewY(${Math.min(60, 90 - itemAngle)}deg) rotate(${itemAngle / 2 - 90}deg) translateY(-150%)`,
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transformOrigin: 'center center',
                    maxWidth: '70%',
                  }}
                >
                  {restaurant.name}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default RestaurantWheel;
