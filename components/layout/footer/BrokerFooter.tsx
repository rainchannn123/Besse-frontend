"use client";

import React from "react";
import Image from "next/image";
import dollar from "@/public/assets/images/dollar.png";
import handshake from "@/public/assets/images/handshake.png";
import littleBag from "@/public/assets/images/little_bag.png";
import co2 from "@/public/assets/images/co2.png";
import openBox from "@/public/assets/images/openBoxed.png";
import closeBox from "@/public/assets/images/closeBoxed.png";
import hammer from "@/public/assets/images/hammerImg.png";
import dollarUp from "@/public/assets/images/dollarUp.png";

export const BrokerFooter: React.FC = () => {
  return (
    <div className="bg-[#50704C]  lg:pt-2 pt-12  pb-3 flex items-center relative">
      <div className="container mx-auto">
        <div>
          <h1 className="text-center font-roboto text-[24px] text-white font-bold pb-3 pt-1">
            Collection
          </h1>
        </div>
        <div className="absolute -top-10">
          <div className="flex gap-2">
            <div className="w-[86px] h-[86px] bg-white rounded-[50%] flex justify-center items-center">
              <Image src={openBox} alt="openBox" />
            </div>
            <div className="w-[86px] h-[86px] bg-white rounded-[50%] flex justify-center items-center">
              <Image src={closeBox} alt="closeBox" />
            </div>
            <div className="w-[86px] h-[86px] bg-white rounded-[50%] flex justify-center items-center">
              <Image src={hammer} alt="hammer" />
            </div>
            <div className="w-[86px] h-[86px] bg-white rounded-[50%] flex justify-center items-center">
              <Image src={dollarUp} alt="dollarUp" />
            </div>
          </div>
        </div>
        <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-2">
          <div className="bg-white flex gap-2 rounded-[10px] px-3  py-1">
            <div className="flex items-center">
              <Image src={dollar} alt="dollar" />
            </div>
            <div className="flex items-center">
              <p className="text-regular text-[24px] font-roboto text-[#000000]">
                Budget 10332
              </p>
            </div>
          </div>

          <div className="bg-white flex gap-2 rounded-[10px] px-3  py-1">
            <div>
              <Image src={handshake} alt="handshake" />
            </div>
            <div>
              <p className="text-regular text-[24px] font-roboto text-[#000000]">
                Relationship 40%
              </p>
              <div className="w-full bg-[#D9D9D9] rounded-full h-4">
                <div
                  className="bg-[#F1BD45] h-4 rounded-full"
                  style={{ width: "40%" }}
                ></div>
              </div>
            </div>
          </div>
          <div className="bg-white flex gap-2 rounded-[10px] px-3  py-1">
            <div className="flex items-center">
              <Image src={littleBag} alt="littleBag" />
            </div>
            <div>
              <p className="text-regular text-[24px] font-roboto text-[#000000]">
                Waste xx/xx tons
              </p>
              <div className="w-full bg-[#D9D9D9] rounded-full h-4">
                <div
                  className="bg-[#54AA4D] h-4 rounded-full"
                  style={{ width: "50%" }}
                ></div>
              </div>
            </div>
          </div>
          <div className="bg-white flex gap-2 rounded-[10px] px-3  py-1">
            <div>
              <Image src={co2} alt="co2" />
            </div>
            <div>
              <p className="text-regular text-[24px] font-roboto text-[#000000]">
                Carbon Emissions
              </p>
              <div className="w-full bg-[#D9D9D9] rounded-full h-4">
                <div
                  className="bg-[#EB5353] h-4 rounded-full"
                  style={{ width: "90%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      ;
    </div>
  );
};
