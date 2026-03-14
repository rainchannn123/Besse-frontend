"use client";
import React from "react";
import buildingColor from "@/public/assets/images/buildingColor.png";
import dollarBag from "@/public/assets/images/dollarBag.png";
import lCo2 from "@/public/assets/images/lCo2.png";
import sideArrow from "@/public/assets/images/sideArrow.png";
import littleBag from "@/public/assets/images/little_bag.png";
import closeBoxed from "@/public/assets/images/closeBoxed.png";
import redHeart from "@/public/assets/images/redHeart.png";
import paper from "@/public/assets/images/paper.png";
import gear from "@/public/assets/images/gear.png";
import coffeeJar from "@/public/assets/images/coffee-jar.png";
import tik from "@/public/assets/images/tik.png";
import recycle from "@/public/assets/images/recycle.png";
import wood from "@/public/assets/images/wood.png";
import bridge from "@/public/assets/images/bridge.png";

import Image from "next/image";

export const MuniciCity: React.FC = () => {
  return (
    <div className="  bg-white border-4 border-dashed border-[#b18c5a] rounded-md p-4">
      <h3 className="text-center 2xl:text-[35px] xl:text-[28px] lg:text-[35px] text-[35px] font-bold text-black mb-1 font-roboto">
        City Planning
      </h3>
      <div className="h-0.5  bg-[#A99065] mb-3"></div>
      <div className="border-b-2 pb-4 border-[#A99065]">
        <div className="flex items-center gap-1">
          <input
            type="radio"
            id="myRadio1"
            name="myRadioGroup"
            value="option1"
            className="form-radio w-5 h-5 accent-[#3A7D2C] cursor-pointer"
          />
          <div className="flex gap-1">
            <p className="text-black font-bold 2xl:text-[25px] xl:text-[19px] lg:text-[25px]  text-[25px] flex items-center">
              1.
            </p>
            <Image src={buildingColor} alt="buildingColor" />
            <h4 className=" text-black font-bold 2xl:text-[25px] xl:text-[19px] lg:text-[25px]  text-[25px] font-roboto flex items-center">
              Park Development
            </h4>
          </div>
        </div>

        <div className="flex justify-between mt-3">
          <p className="font-roboto text-black font-bold text-[20px]">
            Required Materials:{" "}
          </p>
          <div className="flex gap-1 items-center">
            <Image src={paper} alt="paper" className="w-4 h-4" />
            <Image src={gear} alt="gear" className="w-4 h-4" />
            <Image src={coffeeJar} alt="coffeeJar" className="w-4 h-4" />
          </div>
        </div>

        <div className="mx-6">
          <div className=" mt-4 relative">
            <div className="w-full bg-[#D9D9D9] rounded-full h-[18px] mb-1 ">
              <div
                className="bg-[#54AA4D] h-[18px] rounded-full"
                style={{ width: "80%" }}
              ></div>
            </div>
            <p className="font-regular  text-black flex text-[15px] font-roboto  absolute -top-1 right-1">
              80%
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Image src={tik} alt="tik" />
            <p className="font-regular  text-black flex text-[15px] font-roboto">
              Degree of Completion
            </p>
          </div>
        </div>
      </div>

      <div className="border-b-2 pb-4 border-[#A99065] mt-2">
        <div className="flex items-center gap-1">
          <input
            type="radio"
            id="myRadio1"
            name="myRadioGroup"
            value="option1"
            className="form-radio w-5 h-5 accent-[#3A7D2C] cursor-pointer"
          />
          <div className="flex gap-1">
            <p className="text-black font-bold 2xl:text-[25px] xl:text-[19px] lg:text-[25px]  text-[25px] flex items-center">
              2.
            </p>
            <Image src={recycle} alt="recycle" />
            <h4 className=" text-black font-bold 2xl:text-[23px] xl:text-[19px] lg:text-[23px]  text-[23px] font-roboto flex items-center">
              Recycle Construct
            </h4>
          </div>
        </div>

        <div className="flex justify-between mt-3">
          <p className="font-roboto text-black font-bold text-[20px]">
            Required Materials:{" "}
          </p>
          <div className="flex gap-1 items-center">
            <Image src={wood} alt="wood" className="w-4 h-4" />
            <Image src={paper} alt="paper" className="w-4 h-4" />
          </div>
        </div>
        <div className="mx-6">
          <div className="mt-4 relative">
            <div className="w-full bg-[#D9D9D9] rounded-full h-[18px] mb-1 ">
              <div
                className="bg-[#F1BD45] h-[18px] rounded-full"
                style={{ width: "80%" }}
              ></div>
            </div>
            <p className="font-regular  text-black flex text-[15px] font-roboto  absolute -top-1 right-1">
              80%
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Image src={tik} alt="tik" />
            <p className="font-regular  text-black flex text-[15px] font-roboto">
              Degree of Completion
            </p>
          </div>
        </div>
      </div>
      <div className="border-b-2 pb-4 border-[#A99065] mt-2">
        <div className="flex items-center gap-1">
          <input
            type="radio"
            id="myRadio1"
            name="myRadioGroup"
            value="option1"
            className="form-radio w-5 h-5 accent-[#3A7D2C] cursor-pointer"
          />
          <div className="flex gap-1">
            <p className="text-black font-bold 2xl:text-[25px] xl:text-[19px] lg:text-[25px]  text-[25px]  flex items-center">
              2.
            </p>
            <Image src={bridge} alt="bridge" />
            <h4 className=" text-black font-bold 2xl:text-[25px] xl:text-[19px] lg:text-[25px]  text-[25px] font-roboto flex items-center">
              Bridge Renewal{" "}
            </h4>
          </div>
        </div>

        <div className="flex justify-center mt-3">
          <p className="font-roboto text-black font-bold text-[20px]">
            Required Materials:{" "}
          </p>
          <div className="flex gap-1 items-center">
            <Image src={coffeeJar} alt="coffeeJar" className="w-4 h-4" />
            <Image src={wood} alt="wood" className="w-4 h-4" />
          </div>
        </div>

        <div className="mx-6">
          <div className="mt-4 relative">
            <div className="w-full bg-[#D9D9D9] rounded-full h-[18px] mb-1 ">
              <div
                className="bg-[#EB5353] h-[18px] rounded-full"
                style={{ width: "40%" }}
              ></div>
            </div>
            <p className="font-regular  text-black flex text-[15px] font-roboto  absolute -top-1 right-1">
              80%
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Image src={tik} alt="tik" />
            <p className="font-regular  text-black flex text-[15px] font-roboto">
              Degree of Completion
            </p>
          </div>
        </div>
      </div>

      <div className="my-4 flex justify-center items-center">
        <p className="2xl:text-[25px] xl:text-[20px] lg:text-[25px]  text-[25px] font-bold text-black  font-roboto">
          Volume:
        </p>
        <p className="text-[15px] font-bold text-black  font-roboto border-2 border-[#6D974D] px-2 rounded-[25px]">
          <span>-</span> xxt <span>+</span>
        </p>
      </div>

      <div className="mb-5 mt-5 space-y-2">
        {/* Budget */}
        <div className="flex justify-between items-center m-0">
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

        <div className="flex justify-between items-center m-0">
          <div className="flex gap-2 items-center">
            <Image src={redHeart} alt="redHeart" className="w-6 h-6" />
            <p className="text-[20px] font-bold text-black font-roboto">
              City Health
            </p>
          </div>
          <p className="text-[20px] font-normal text-black font-roboto">
            + xx%
          </p>
        </div>

        {/* CO2 */}
        <div className="flex justify-between items-center m-0">
          <div className="flex gap-2 items-center">
            <Image src={lCo2} alt="lCo2" className="w-6 h-6" />
            <p className="text-[20px] font-bold text-black font-roboto">CO₂</p>
          </div>
          <p className="text-[20px] font-normal text-black font-roboto">
            + 1.6t
          </p>
        </div>

        {/* Material Quality */}
        <div className="flex justify-between items-center m-0">
          <div className="flex gap-2 items-center">
            <Image src={littleBag} alt="littleBag" className="w-6 h-6" />
            <p className="text-[20px] font-bold text-black font-roboto">
              Waste
            </p>
          </div>
          <p className="text-[20px] font-normal text-black font-roboto">
            + xxt
          </p>
        </div>

        <div className="flex justify-between items-center m-0">
          <div className="flex gap-2 items-center">
            <Image src={closeBoxed} alt="closeBoxed" className="w-6 h-6" />
            <p className="text-[20px] font-bold text-black font-roboto">
              Inventory
            </p>
          </div>
          <p className="text-[20px] font-normal text-black font-roboto">
            + xxt
          </p>
        </div>
      </div>

      <button className="w-full bg-[#6D974D]  hover:bg-[#6D974D] flex justify-around rounded-[5px]">
        <p></p>
        <p className="text-white py-2 rounded-[5px] font-bold text-[24px]">
          Send
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
