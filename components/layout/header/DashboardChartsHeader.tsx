"use client";
import polygon from "@/public/assets/images/PolygonWhite.png";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";
export const DashboardChartsHeader: React.FC = () => {
  const router = useRouter();

  const handleBackClick = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/dashboard/besse-group");
  };

  return (
    <div className="bg-[#616161] h-24 w-full flex items-center justify-between px-16">
      <div>
        {/* <button
          className="flex gap-3 justify-center items-center border border-white px-4 py-1"
          onClick={handleBackClick}
        >
          <Image src={polygon} alt="" />
          <p className=" font-roboto font-normal text-[24px] text-white">
            Back
          </p>
        </button> */}
      </div>
      <h4 className=" font-roboto font-bold text-[40px] text-white">
        City Name
      </h4>
      <div></div>
    </div>
  );
};
