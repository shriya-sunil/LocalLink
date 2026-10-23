import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  totalReviews?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  totalReviews,
  interactive = false,
  onChange,
  size = 'md',
  showNumber = true,
}) => {
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 26 : 18;

  return (
    <div className="inline-flex items-center gap-1.5" role="group" aria-label={`Rating: ${rating} out of 5 stars`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((starVal) => {
          const filled = starVal <= Math.round(rating);
          return (
            <button
              type="button"
              key={starVal}
              disabled={!interactive}
              onClick={() => interactive && onChange && onChange(starVal)}
              className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform p-0.5' : 'cursor-default'}`}
              aria-label={interactive ? `Rate ${starVal} stars` : undefined}
            >
              <Star
                size={iconSize}
                className={filled ? 'fill-coral text-coral' : 'text-gray-300'}
                strokeWidth={filled ? 0 : 1.5}
              />
            </button>
          );
        })}
      </div>
      {showNumber && (
        <span className="font-semibold text-navy text-sm ml-0.5">
          {rating ? rating.toFixed(1) : '5.0'}
        </span>
      )}
      {totalReviews !== undefined && (
        <span className="text-xs text-gray-500">
          ({totalReviews})
        </span>
      )}
    </div>
  );
};
