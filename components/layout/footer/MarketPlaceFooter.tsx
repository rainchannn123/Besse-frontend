"use client";

import React from "react";
import Image from "next/image";
import heart from "@/public/assets/images/heart.png";
import bigBag from "@/public/assets/images/big_bag.png";
import co2 from "@/public/assets/images/co2.png";
import bigDollar from "@/public/assets/images/bigDollar.png";

import RecordCard from "./RecordCard";
interface MetricProps {
    icon: any;
    children: React.ReactNode;
}

const MetricItem: React.FC<MetricProps> = ({ icon, children }) => {
    return (

        <div className="flex items-center px-1 ">
            <div className="flex items-center z-10">
                <Image src={icon} alt="metric-icon" />
            </div>

            <div className="bg-white rounded-xl w-full h-[46px] flex items-center justify-end pl-10 -ml-8 sm:pl-6 sm:-ml-10">
                {children}
            </div>
        </div>
    );
};

export const MarketPlaceFooter: React.FC = () => {
    return (
        <div className="pt-2 w-full">

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2 relative min-h-[100px] md:min-h-0">
                    <div className="md:absolute md:bottom-0 w-full">
                        <RecordCard />
                    </div>
                </div>
                <div className="md:col-span-3 mb-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-2 px-2">
                        <MetricItem icon={bigDollar}>
                            <p className="text-medium text-[24px] font-roboto text-[#000000] text-right w-11/12 pr-2">
                                10332
                            </p>
                        </MetricItem>
                        <MetricItem icon={heart}>
                            <div className="w-11/12 pr-2">
                                <div className="w-full bg-[#D9D9D9] rounded-full h-[29px]">
                                    <div
                                        className="bg-[#F1BD45] h-[29px] rounded-full flex items-center pl-2 text-sm font-medium"
                                        style={{ width: "40%" }}
                                    >
                                        40%
                                    </div>
                                </div>
                            </div>
                        </MetricItem>
                        <MetricItem icon={bigBag}>
                            <p className="text-bold font-roboto text-[20px] sm:text-[24px] lg:text-[26px] font-roboto text-[#000000] w-11/12 pr-2 whitespace-nowrap">
                                122/150 tons
                            </p>
                        </MetricItem>
                        <MetricItem icon={co2}>
                            <div className="w-11/12 pr-2">
                                <div className="w-full bg-[#D9D9D9] rounded-full h-[29px]">
                                    <div
                                        className="bg-[#EB5353] h-[29px] rounded-full flex items-center px-3 text-white font-roboto font-medium text-sm justify-end"
                                        style={{ width: "90%" }}
                                    >
                                        90%
                                    </div>
                                </div>
                            </div>
                        </MetricItem>
                    </div>
                </div>
            </div>
        </div>
    );
};