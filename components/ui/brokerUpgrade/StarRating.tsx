import React from "react";
import { Star } from "lucide-react"; // you can replace with your own SVGs

interface StarRatingProps {
    rating: number; // e.g. 3.5 or 4
}

const StarRating: React.FC<StarRatingProps> = ({ rating }) => {
    const totalStars = 5;

    // Create array of 5 and determine each star's state
    const stars = Array.from({ length: totalStars }, (_, index) => {
        const starValue = index + 1;
        if (rating >= starValue) return "full";
        // if (rating >= starValue - 0.5) return "half";
        return "empty";
    });

    return (
        <div className="flex items-center gap-2">
            {stars.map((type, index) => (
                <span key={index}>
                    {type === "full" && (
                        <Star className="w-7 h-7 text-[#F1BD45] fill-[#F1BD45]" />
                    )}
                    {/* {type === "half" && (
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-200" />
                    )} */}
                    {type === "empty" && (
                        <Star className="w-7 h-7 text-[#D9D9D9] fill-[#D9D9D9]" />
                    )}
                </span>
            ))}
        </div>
    );
};

export default StarRating;
