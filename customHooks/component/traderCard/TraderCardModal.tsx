"use client";
import React from "react";
import trade from "@/public/assets/images/trade.png";
import cartoon from "@/public/assets/images/cartoon.png";
import Image from "next/image";
import { X } from "lucide-react";
interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function TraderCardModal({
  open,
  onClose,
  children,
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex  items-center justify-center">
      {/* Black Overlay (no blur) */}
      <div className="absolute inset-0  bg-[#A579584D] " onClick={onClose} />

      {/* Modal Box */}
      <div className="   relative bg-[#A57958] rounded-lg 2xl:w-[75%]  lg:w-[90%] shadow-lg  p-6 z-50">
        <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 md:gap-0 gap-6">
          <div
            className="md:hidden absolute top-3 right-4 border border-white rounded-sm"
            onClick={onClose}
          >
            <X size={40} color="#fff" />
          </div>
          <div className="flex items-center ">
            <div className="bg-[#D9D9D9] mx-6 pb-3">
              <div className="">
                <div>
                  <p className="font-righteous font-normal text-[16px] text-center text-white">
                    Steel
                  </p>
                  <Image src={trade} alt="" className="w-full" />
                </div>
              </div>

              <div className="flex justify-between">
                <div className="px-1 pt-2 pb-1 ">
                  <p className="font-righteous font-normal text-[16px] text-black">
                    Utensils
                  </p>
                  <p className="font-righteous font-normal text-[12px] text-[#00000057]">
                    Stainless Steel
                  </p>
                </div>

                <div className="px-1 pt-2 pb-1 text-right">
                  <p className="font-righteous font-normal text-[16px] text-black">
                    Material
                  </p>
                  <p className="font-righteous font-normal text-[12px] text-[#00000057]">
                    steel
                  </p>
                </div>
              </div>

              <div className="p-4  my-2 mx-4 bg-[#777777]  text-white">
                <div className="flex items-center justify-between my-6">
                  <span className="font-righteous font-normal text-[32px] text-center text-black">
                    Quantity
                  </span>
                  <span className="font-righteous font-normal text-[32px] text-center text-white">
                    2 tons
                  </span>
                </div>

                <div className="flex items-center justify-between my-2">
                  <span className="font-righteous font-normal text-[32px] text-center text-black">
                    Material
                  </span>
                  <span className="font-righteous font-normal text-[32px] text-center text-white">
                    Steel
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 col-span-1 ">
            <div className="bg-[#F2D6C0] h-full w-full p-8">
              <h2 className="font-normal font-righteous text-black md:text-[35px] text-[30px]">
                Bal:xxx
              </h2>
              <p className="font-normal font-righteous text-black md:text-[35px] text-[30px] text-center">
                Purchase Material
              </p>
              <div className="flex justify-around md:px-20 px-28">
                <p className="font-righteous font-normal md:text-[48px] text-[33px] text-white">
                  $
                </p>
                <p className="font-righteous font-normal md:text-[48px] text-[33px] text-white">
                  77.35
                </p>
              </div>

              <div className="py-8 ">
                <h5 className="text-center font-righteous font-normal md:text-[32px] text-[27px] text-black">
                  Time Left
                </h5>
                <div className="flex justify-center">
                  <div className="bg-black border border-[#FF0000] h-[25px] px-8 flex items-center rounded-[5px] w-34">
                    <span className="text-[#FF0000] text-lg font-bold">
                      04:33:56
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center items-center gap-2 mt-16 mb-6">
                <div>
                  <Image src={cartoon} alt="" />
                </div>
                <div>
                  <p className="font-righteous font-normal text-[12px] text-black">
                    Owned By:PuffinMyPirp
                  </p>
                  <p className="font-righteous font-normal text-[12px] text-black">
                    {" "}
                    0x87B1...6c38
                  </p>
                </div>
              </div>
              <hr className="border-[#0000004D]" />

              <div className="flex justify-center mt-6">
                <button className=" md:w-[288px] w-[200px] py-3 md:text-[36px] text-[28px] font-normal text-white bg-[#F1BD45] rounded-[22px] font-righteous [text-shadow:2px_2px_0_#7B5C46,-2px_-2px_0_#7B5C46,2px_-2px_0_#7B5C46,-2px_2px_0_#7B5C46,0_2px_0_#7B5C46,2px_0_0_#7B5C46,0_-2px_0_#7B5C46,-2px_0_0_#7B5C46]">
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
