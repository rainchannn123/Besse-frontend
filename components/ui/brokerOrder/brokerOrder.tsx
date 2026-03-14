"use client";
import React from "react";
import sideArrow from "@/public/assets/images/sideArrow.png";
import paper from "@/public/assets/images/paper.png";
import wood from "@/public/assets/images/wood.png";
import Image from "next/image";

export const BrokerOrder: React.FC = () => {
  return (
    <div className=" h-[460px] bg-white border-4 border-dashed border-[#b18c5a] rounded-md p-4">
      <h3 className="text-center 2xl:text-[35px] xl:text-[26px] lg:text-[35px] text-[35px] font-bold text-black mb-1 font-roboto">
        Material Request
      </h3>
      <div className="h-0.5  bg-[#A99065] mb-3"></div>
      <div className="border-b-2 pb-4 border-[#A99065]">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex gap-4 items-center">
              <div>
                <Image src={paper} alt="paper" />
              </div>
              <div>
                <div className="flex gap-3 items-center">
                  <h5 className="2xl:text-[35px] xl:text-[28px] lg:text-[35px] text-[35px] font-bold text-black font-roboto">
                    Paper
                  </h5>
                  <small className="text-[15px] font-regular text-black font-roboto">
                    XXXXXX
                  </small>
                </div>
                <div className=" flex">
                  <p className="2xl:text-[25px] xl:text-[20px] lg:text-[25px]  text-[25px] font-regular text-black font-roboto">
                    Volume:
                  </p>
                  <p className="text-[15px] font-bold text-black  font-roboto border-2 border-[#6D974D] px-2 rounded-[25px] h-[32px]">
                    <span>-</span> xxt <span>+</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b-2 pb-4 border-[#A99065] mt-3">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex gap-4 items-center">
              <div>
                <Image src={wood} alt="wood" />
              </div>
              <div>
                <div className="flex gap-3 items-center">
                  <h5 className="2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px] font-bold text-black font-roboto">
                    Wood
                  </h5>
                  <small className="2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px]  font-regular text-black font-roboto">
                    XXXXXX
                  </small>
                </div>
                <div className=" flex">
                  <p className="2xl:text-[25px] xl:text-[20px] lg:text-[25px]  text-[25px]  font-regular text-black font-roboto">
                    Volume:
                  </p>
                  <p className="2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px] font-bold text-black  font-roboto border-2 border-[#6D974D] px-2 rounded-[25px] h-8">
                    <span>-</span> xxt <span>+</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button className="w-full bg-[#6D974D]  hover:bg-[#6D974D] flex justify-around rounded-[5px] mt-6">
        <p></p>
        <p className="text-white py-2 rounded-[5px] font-bold text-[24px]">
          Request to MRF
        </p>
        <div className="flex items-center">
          <div className="bg-[#C0D066] w-[33px] h-[33px] rounded-[50%] flex justify-center items-center">
            <Image src={sideArrow} alt="sideArrow" />
          </div>
        </div>
      </button>
    </div>
  );
};
