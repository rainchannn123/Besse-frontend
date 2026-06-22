"use client";

import React, { useState } from "react";
import trade from "@/public/assets/images/trade.png";
import trade2 from "@/public/assets/images/trade2.png";
import Image, { StaticImageData } from "next/image";
import TraderCardModal from "./TraderCardModal";
// import { MarketPlaceFooter } from "@/components/layout/footer/MarketPlaceFooter";
interface MaterialOffer {
  id: string;
  title: string;
  subtitle: string;
  material: string;
  imageAlt: string;
  imageSrc: StaticImageData;
  quantity: number;
  unit: string;
  time: string;
  priceEth: number;
  priceWei: number;
}

// Data for the three cards based on the image
const offers: MaterialOffer[] = [
  {
    id: "1105720",
    title: "Utensils",
    subtitle: "Stainless Steel",
    material: "Steel",
    imageAlt: "Stainless steel utensils",
    imageSrc: trade,
    quantity: 2,
    unit: "tons",
    time: "04:33:56",
    priceEth: 77.35,
    priceWei: 0.0201,
  },
  {
    id: "1185665",
    title: "Glass",
    subtitle: "Glass Sheets",
    material: "Glass",
    imageAlt: "Stacked glass sheets",
    imageSrc: trade2,
    quantity: 22,
    unit: "tons",
    time: "01:23:18",
    priceEth: 7.65,
    priceWei: 0.0021,
  },
  {
    id: "756194",
    title: "Utensils",
    subtitle: "Stainless Steel",
    material: "Steel",
    imageAlt: "Stainless steel utensils",
    imageSrc: trade,
    quantity: 2,
    unit: "tons",
    time: "04:33:56",
    priceEth: 77.35,
    priceWei: 0.0201,
  },
];

export const TraderCard: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex justify-center flex-wrap gap-6">
        {offers.map((offer) => (
          <div
            className="w-full max-w-sm bg-[#7B5C46] shadow-xl overflow-hidden mx-2"
            key={offer?.id}
          >
            <div className="flex justify-between items-center px-4 py-4 ">
              <span className="text-white font-bold text-xl">#{offer.id}</span>
              <span className="text-xs font-semibold text-green-400 bg-green-900 px-2 py-1 rounded">
                For sale
              </span>
            </div>
            <div className="bg-[#D9D9D9] mx-6 pb-3">
              <div className="">
                <div>
                  <p className="font-righteous font-normal text-[16px] text-center text-white">
                    {offer?.material}
                  </p>
                  <Image src={offer?.imageSrc} alt="" className="w-full" />
                </div>
              </div>

              <div className="flex justify-between">
                <div className="px-1 pt-2 pb-1 ">
                  <p className="font-righteous font-normal text-[16px] text-black">
                    {offer.title}
                  </p>
                  <p className="font-righteous font-normal text-[12px] text-[#00000057]">
                    {offer.subtitle}
                  </p>
                </div>

                <div className="px-1 pt-2 pb-1 text-right">
                  <p className="font-righteous font-normal text-[16px] text-black">
                    {offer.title}
                  </p>
                  <p className="font-righteous font-normal text-[12px] text-[#00000057]">
                    {offer.subtitle}
                  </p>
                </div>
              </div>

              <div className="p-4  my-2 mx-4 bg-[#777777]  text-white">
                <div className="flex items-center justify-between my-6">
                  <span className="font-righteous font-normal text-[32px] text-center text-black">
                    Quantity
                  </span>
                  <span className="font-righteous font-normal text-[32px] text-center text-white">
                    {offer.quantity} {offer.unit}
                  </span>
                </div>

                <div className="flex items-center justify-between my-2">
                  <span className="font-righteous font-normal text-[32px] text-center text-black">
                    Material
                  </span>
                  <span className="font-righteous font-normal text-[32px] text-center text-white">
                    {offer.material}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer and Buy Button */}
            <div className="px-6">
              <div className="  mb-4">
                <div className="flex justify-between">
                  <span className="font-righteous font-normal text-[32px] text-center text-white">
                    Time left
                  </span>
                  <div className="flex items-center">
                    <div className="bg-black border border-[#FF0000] h-[25px] px-8 flex items-center rounded-[5px]">
                      <span className="text-[#FF0000] text-lg font-bold">
                        {offer.time}
                      </span>
                    </div>
                  </div>
                </div>

                <div className=" flex justify-center">
                  <div className="bg-[#00000059] w-[203px] p-2">
                    <div className="flex justify-between">
                      <span className="font-righteous font-normal text-[32px] text-center text-white">
                        $
                      </span>
                      <span className="font-righteous font-normal text-[32px] text-center text-white">
                        {offer.priceEth}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="font-righteous font-normal text-[14px] text-center text-[#979797]">
                        ETH
                      </span>
                      <span className="font-righteous font-normal text-[14px] text-center text-[#979797]">
                        {offer.priceWei.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center mb-3">
                <button
                  onClick={() => setOpen(true)}
                  className="
    w-[150px] py-1 text-[22px] font-normal text-white 
    bg-[#F1BD45] rounded-lg font-righteous
    [text-shadow:2px_2px_0_#7B5C46,-2px_-2px_0_#7B5C46,2px_-2px_0_#7B5C46,-2px_2px_0_#7B5C46,0_2px_0_#7B5C46,2px_0_0_#7B5C46,0_-2px_0_#7B5C46,-2px_0_0_#7B5C46]
  " >{" "}Buy Material{" "}</button>

                {/* <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                  onClick={() => setOpen(true)}
                >
                  Open Modal
                </button> */}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* <div className="">
        <MarketPlaceFooter></MarketPlaceFooter>
      </div> */}
      <TraderCardModal
        open={open}
        onClose={() => setOpen(!true)} children={undefined}      ></TraderCardModal>
    </div>
  );
};
