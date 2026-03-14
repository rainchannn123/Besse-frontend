"use client";

import React from "react";
import paper from "@/public/assets/images/paper.png";
import dollarBag from "@/public/assets/images/dollarBag.png";
import lCo2 from "@/public/assets/images/lCo2.png";
import stars from "@/public/assets/images/stars.png";
import sideArrow from "@/public/assets/images/sideArrow.png";
import Image from "next/image";
export const Paper: React.FC = () => {
  return (
    <div className="flex items-center">
      <div className="h-[500px] bg-white border-4 border-dashed border-[#b18c5a] rounded-md p-4">
        <h3 className="text-center 2xl:text-[35px] xl:text-[28px] lg:text-[35px] text-[35px] font-bold text-black mb-1">
          Collection Action
        </h3>
        <div className="h-0.5 mx-4 bg-[#A99065] mb-3"></div>

        <div className="flex justify-center gap-4 mt-6">
          <Image src={paper} alt="paper" />
          <h4 className="2xl:text-[35px] xl:text-[28px] lg:text-[35px] text-[35px] font-bold text-black mb-1 font-roboto">
            Paper
          </h4>
        </div>
        <div className="my-4 flex justify-center items-center">
          <p className="2xl:text-[25px] xl:text-[20px] lg:text-[25px]  text-[25px] font-bold text-black  font-roboto">
            Volume:
          </p>
          <p className="text-[15px] font-bold text-black  font-roboto border-2 border-[#6D974D] px-2 rounded-[25px]">
            <span>-</span> xxt <span>+</span>
          </p>
        </div>

        <div className="flex justify-around">
          <div className="flex items-center">
            <input
              type="radio"
              id="myRadio1"
              name="myRadioGroup"
              value="option1"
              className="form-radio w-5 h-5  accent-[#3A7D2C] cursor-pointer"
            />
            <label
              htmlFor="htmlFor"
              className="ml-2 2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px]  font-bold text-black font-roboto"
            >
              Accept
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="myRadio1"
              name="myRadioGroup"
              value="option1"
              className="form-radio w-5 h-5 accent-[#3A7D2C] cursor-pointer"
            />
            <label
              htmlFor="htmlFor"
              className="ml-2 2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px] font-bold text-black font-roboto"
            >
              Reject
            </label>
          </div>
        </div>
        <div className="mb-5 mt-5 space-y-2">
          {/* Budget */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <Image src={dollarBag} alt="dollarBag" className="w-6 h-6" />
              <p className="2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px] font-bold text-black font-roboto">
                Budget
              </p>
            </div>
            <p className="2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px]  font-normal text-black font-roboto">
              - $2,100
            </p>
          </div>

          {/* CO2 */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <Image src={lCo2} alt="lCo2" className="w-6 h-6" />
              <p className="2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px] font-bold text-black font-roboto">
                CO₂
              </p>
            </div>
            <p className="2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px] font-normal text-black font-roboto">
              + 1.6t
            </p>
          </div>

          {/* Material Quality */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <Image src={stars} alt="stars" className="w-6 h-6" />
              <p className="2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px]  font-bold text-black font-roboto">
                Material Quality
              </p>
            </div>
            <p className="2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px] font-normal text-black font-roboto">
              +/- xx%
            </p>
          </div>
        </div>

        <button className="w-full bg-[#6D974D]  hover:bg-[#6D974D] flex justify-around  rounded-[5px]">
          <p></p>
          <p className="text-white py-2 rounded-[5px] font-bold 2xl:text-[24px]  xl:text-[16px] lg:text-[24px] text-[24px]">
            Confirm
          </p>
          <div className="flex items-center">
            <div className="bg-[#C0D066] w-[33px] h-[33px] rounded-[50%] flex justify-center items-center">
              <Image src={sideArrow} alt="sideArrow" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
