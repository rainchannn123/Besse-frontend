"use client";
import React, { useState } from "react";
import bigTracked from "@/public/assets/images/bigTrack.png";
import polygonLeft from "@/public/assets/images/PolygonLeft.png";
import polygonRight from "@/public/assets/images/PolygonRight.png";
import Image from "next/image";
const slides = [
  {
    id: 1,
    image: bigTracked,
    title: "Beautiful Landscape",
  },
  {
    id: 2,
    image: bigTracked,
    title: "Mountain View",
  },
  {
    id: 3,
    image: bigTracked,
    title: "Serene Lake",
  },
];

const CustomSlider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative w-full mx-auto overflow-hidden rounded-2xl ">
      {/* Slider Images */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="min-w-full relative">
            <div className="flex justify-center">
              <Image src={slide.image} alt={slide.title} />
            </div>
          </div>
        ))}
      </div>

      {/* Left Arrow */}
      <button
        onClick={prevSlide}
        className="absolute top-1/2 -translate-y-1/2 left-4 transition"
      >
        <Image src={polygonLeft} alt="polygonLeft" />
      </button>

      {/* Right Arrow */}
      <button
        onClick={nextSlide}
        className="absolute top-1/2 -translate-y-1/2 right-4 transition"
      >
        <Image src={polygonRight} alt="polygonRight" />
      </button>
    </div>
  );
};

export default CustomSlider;
