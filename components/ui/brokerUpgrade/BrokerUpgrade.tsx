"use client";
import React, { JSX } from "react";
import sideArrow from "@/public/assets/images/sideArrow.png";
import Image from "next/image";
import dollarBag from "@/public/assets/images/dollarBag.png";
import lCo2 from "@/public/assets/images/lCo2.png";
import smallBox from "@/public/assets/images/smallBox.png";
import speed from "@/public/assets/images/speed.png";
import leaf from "@/public/assets/images/leaf.png";
import power from "@/public/assets/images/power.png";

interface Feature {
  id: number;
  name: string;
  icon: JSX.Element;
  level: number;
}

export const BrokerUpgrade: React.FC = () => {
  const features: Feature[] = [
    { id: 1, name: "Speed", icon: speed, level: 4 },
    { id: 2, name: "Power", icon: power, level: 3 },
    { id: 3, name: "Load Capacity", icon: smallBox, level: 5 },
    { id: 4, name: "Green Engine", icon: leaf, level: 4 },
  ];

  return (
    <div className=" bg-white border-4 border-dashed border-[#b18c5a] rounded-md p-4">
      <h3 className="text-center text-[33px] font-bold text-black mb-1 font-roboto">
        Vehicle Action
      </h3>
      <div className="h-0.5  bg-[#A99065] mb-3"></div>

      <div>
        <div className="flex flex-col gap-4 ">
          {features.map((feature) => (
            <div key={feature.id} className="flex  gap-3 cursor-pointer">
              <div className="pt-3">
                <input
                  type="radio"
                  id="myRadio1"
                  name="myRadioGroup"
                  value="option1"
                  className="form-radio w-5 h-5 accent-[#3A7D2C] cursor-pointer"
                />
              </div>
              {/* Label and Bars */}
              <div className="flex flex-col gap-1 w-full">
                <div className="flex items-center gap-2">
                  <Image src={feature.icon} alt="" />
                  <span className="font-bold text-[25px] font-roboto text-black">
                    {feature.name}
                  </span>
                </div>

                {/* Bars made from array */}
                <div className="flex gap-[3px] mt-1">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div
                      key={index}
                      className={`h-10 w-[17px] rounded-[25px] ${
                        index < feature.level ? "bg-[#6D974D]" : "bg-gray-200"
                      }`}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-5 mt-5 space-y-2">
        {/* Budget */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <Image src={dollarBag} alt="dollarBag" className="w-6 h-6" />
            <p className="text-[20px] font-bold text-black font-roboto">
              Budget
            </p>
          </div>
          <p className="text-[20px] font-normal text-black font-roboto">
            - $2,100
          </p>
        </div>

        {/* CO2 */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <Image src={lCo2} alt="lCo2" className="w-6 h-6" />
            <p className="text-[20px] font-bold text-black font-roboto">CO₂</p>
          </div>
          <p className="text-[20px] font-normal text-black font-roboto">
            + 1.6t
          </p>
        </div>
      </div>

      <button className="w-full bg-[#6D974D]  hover:bg-[#6D974D] flex justify-around rounded-[5px] mt-6">
        <p></p>
        <p className="text-white py-2 rounded-[5px] font-bold text-[24px]">
          Upgrade
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
