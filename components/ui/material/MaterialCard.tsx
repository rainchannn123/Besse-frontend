"use client";

import React from "react";
import littleBag from "@/public/assets/images/little_bag.png";
import heart from "@/public/assets/images/heart.png";
import Image from "next/image"
interface Material {
    name: string;
    percent: number;
    color: string;
    icon: string;
}

interface MaterialCardProps {
    title: string;
    wasteAmount: string;
    speed: string;
    progressPercent: number;
    materials: Material[];
    cityHealthChange: string;
}

export const MaterialCard: React.FC<MaterialCardProps> = ({
    title,
    wasteAmount,
    speed,
    progressPercent,
    materials,
    cityHealthChange,
}) => {
    return (
        <div className="bg-white  shadow-md border border-gray-200 p-4 font-sans">
            {/* Waste Header */}
            <div className="mb-3 relative">


                <div className="w-full bg-[#D9D9D9] rounded-full h-[18px] mb-1 ">
                    <div
                        className="bg-[#54AA4D] h-[18px] rounded-full"
                        style={{ width: `${progressPercent}%` }}
                    ></div>

                    <div className="flex justify-between items-center mt-1">
                        <p className="font-regular  text-black flex text-[15px] font-roboto items-center gap-1">
                            <Image src={littleBag} alt="littleBag" className="w-6 h-6 " /> {title}
                        </p>
                        <p className="font-regular  text-black flex text-[15px] font-roboto ">{wasteAmount}</p>
                    </div>
                </div>

                <p className="font-regular  text-black flex text-[15px] font-roboto  absolute -top-1 right-1">{speed}</p>
            </div>

            {/* Materials Section */}
            <div className="mt-9">
                <h3 className="font-bold  text-black flex text-[20px] font-roboto mb-3">Materials:</h3>

                <div className="grid grid-cols-3 gap-3">
                    {materials.map((item, index) => (
                        <div key={index} className="flex flex-col items-center">
                            <div className="relative w-14 h-14 rounded-full flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full border-6 border-[#e5e7eb]"></div>
                                <div
                                    className="absolute inset-0 rounded-full border-6 border-t-transparent border-r-transparent"
                                    style={{
                                        borderColor: `${item.color} transparent transparent ${item.color}`,
                                        transform: `rotate(${(item.percent / 100) * 360}deg)`,
                                    }}
                                ></div>
                                <p className="font-bold  text-[#545454] flex text-[15px] font-roboto ">{item.percent}%</p>
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-[11px] font-roboto ">
                                <Image src={item.icon} alt={item.name} className="w-3 h-3" />
                                <p>{item.name}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* City Health */}
            <div className="flex justify-between items-center mt-5">
                <div className="flex items-center gap-3 font-medium">
                    <Image src={heart} alt="heart" className="h-6 w-6" /> <span className="font-regular text-black flex text-[17px] font-roboto ">City Health</span>
                </div>
                <p className="font-regular  text-black flex text-[17px] font-roboto ">{cityHealthChange}</p>
            </div>

            {/* Select Button */}

            <div className="flex items-center justify-center mt-3">
                <input
                    type="radio"
                    id="myRadio1"
                    name="myRadioGroup"
                    value="option1"
                    className="form-radio w-5 h-5 accent-[#3A7D2C] cursor-pointer"
                />
                <label
                    htmlFor="myRadio2"
                    className="ml-2 text-black font-bold text-[20px]"
                >
                    Select
                </label>

            </div>
        </div >
    );
};
