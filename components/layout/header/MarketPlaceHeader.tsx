"use client";

import React from "react";
import Image from "next/image";
import cross from "@/public/assets/images/cross.png";
import woodenHeading from "@/public/assets/images/woodenHeading.png"
export const MarketPlaceHeader: React.FC = () => {
    return (
        <div className="">
            <div
                className="bg-cover bg-center  mx-auto sm:px-0 px-8 sm:mx-0 py-2"
                style={{
                    backgroundImage: `url(${woodenHeading.src})`,
                }}
            >


                <div className="container mx-auto sm:flex justify-between md:px-0 sm:px-4 px-0 ">
                    {/* Back Button */}
                    <div className="flex items-center justify-center sm:gap-0 gap-2 z-10 ">
                        <div className="flex items-center justify-center bg-[rgba(165,230,241,1)] rounded-[50%] p-3 border border-white">
                            <Image
                                src={cross}
                                alt="cross"
                            />
                        </div>

                        <div className="border bg-[#287DA5B2] border-2 border-[#BDE1F7] rounded-[50px] px-10 sm:py-0 py-1 sm:ml-[-35px] sm:-z-1 " >
                            <p className="text-white text-[16px] md:text-[22px] lg:text-[24px] font-roboto font-normal">
                                Municipality
                            </p>
                            <p className="text-white text-[16px] md:text-[22px] lg:text-[24px] font-roboto font-normal -mt-2">
                                @ID
                            </p>
                        </div>
                    </div>

                    {/* Center Title */}
                    <div className="lg:flex hidden items-center">
                        <h1
                            className="font-bold text-[24px] md:text-[28px] lg:text-[50px] font-roboto text-white [text-shadow:3px_3px_0_#2D4367,-3px_-3px_0_#2D4367,3px_-3px_0_#2D4367,-3px_3px_0_#2D4367,0_2px_0_#2D4367,3px_0_0_#2D4367,0_-3px_0_#2D4367,-3px_0_0_#2D4367] "> CityName</h1>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center justify-center  sm:w-auto gap-8  sm:mt-0 mt-4">
                        <input
                            type="text"
                            className=" w-full px-4 py-3  border border-gray-300   rounded-md  bg-white text-black focus:outline-none" />

                    </div>
                </div>
            </div>
        </div>
    )
};