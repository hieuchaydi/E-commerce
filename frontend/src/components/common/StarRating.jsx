import React, { useCallback } from 'react';
import './StarRating.css';

const StarRating = ({ rating, editable = false, onRatingChange, size = 'medium' }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  const handleClick = useCallback((value) => {
    if (editable && onRatingChange) {
      onRatingChange(value);
    }
  }, [editable, onRatingChange]);

  return (
    <div className={`star-rating ${size}`}>
      {[...Array(5)].map((_, i) => {
        const value = i + 1;
        let starClass = 'star';
        
        if (value <= fullStars) starClass += ' full';
        else if (value === fullStars + 1 && hasHalfStar) starClass += ' half';

        return (
          <span
            key={value}
            className={starClass}
            onClick={() => handleClick(value)}
            style={{ cursor: editable ? 'pointer' : 'default' }}
            aria-label={`${value} sao`}
          >
            ★
          </span>
        );
      })}
    </div>
  );
};

export default React.memo(StarRating);