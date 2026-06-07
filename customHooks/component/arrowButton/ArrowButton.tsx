"use client";

import React from "react";
import Image from "next/image";
import sideArrow from "@/public/assets/images/sideArrow.png";
export const ArrowButton: React.FC = () => {
    return (
        <div>
            <div className="flex justify-center pb-3">
                <button className="flex justify-center items-center gap-10  bg-[#E1E1E1]  px-3 py-2 rounded-[5px]" style={{ boxShadow: "0 3px 7px rgba(0, 0, 0, 0.4)", }}>
                    <p className="text-[#6D924B] font-bold md:text-[27px] text-[24px] font-roboto">Continue</p>
                    <div className="bg-[#C0D066]  w-[38px] h-[38px] flex justify-center items-center rounded-[50%]">
                        <Image src={sideArrow} alt="sideArrow" />
                    </div>
                </button>
            </div>
        </div>
    );
}; 