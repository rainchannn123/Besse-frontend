"use client";

import React from "react";
import paper from "@/public/assets/images/paper.png";
import dollarBag from "@/public/assets/images/dollarBag.png";
import lCo2 from "@/public/assets/images/lCo2.png";
import stars from "@/public/assets/images/stars.png";
import sideArrow from "@/public/assets/images/sideArrow.png";
import Image from "next/image";
export const MuniciOrder: React.FC = () => {
    return (

        <div className=" h-[327px] bg-white border-4 border-dashed border-[#b18c5a] rounded-md p-4">
            <h3 className="text-center 2xl:text-[35px] xl:text-[28px] lg:text-[35px] text-[35px] font-bold text-black mb-1">
                Waste Action
            </h3>
            <div className="h-0.5 mx-4 bg-[#A99065] mb-3"></div>

            <div className="flex justify-center gap-4 mt-6">
                <Image src={paper} alt="paper" />
                <h4 className="2xl:text-[35px] xl:text-[28px] lg:text-[35px] text-[35px]  font-bold text-black mb-1 font-roboto">
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


            <button className="w-full bg-[#50704C]  hover:bg-[#50704C] flex justify-around  rounded-[5px]">
                <p></p>
                <p className="text-white py-2 rounded-[5px] font-bold text-[24px]">
                    Request
                </p>
                <div className="flex items-center">
                    <div className="bg-[#C0D066] w-[33px] h-[33px] rounded-[50%] flex justify-center items-center">
                        <Image src={sideArrow} alt="sideArrow" />
                    </div>
                </div>
            </button>
        </div>

    )
}; 