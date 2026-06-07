"use client";
import React from "react";
import dollarBag from "@/public/assets/images/dollarBag.png";
import lCo2 from "@/public/assets/images/lCo2.png";
import sideArrow from "@/public/assets/images/sideArrow.png";
import closeBoxed from "@/public/assets/images/closeBoxed.png";
import paper from "@/public/assets/images/paper.png";
import tik from "@/public/assets/images/tik.png";
import wood from "@/public/assets/images/wood.png";
import paperStart from "@/public/assets/images/paperStar.png";
import Image from "next/image";

export const MRFOrder: React.FC = () => {
  return (
    <div className="  bg-white border-4 border-dashed border-[#b18c5a] rounded-md p-4">
      <h3 className="text-center 2xl:text-[35px] xl:text-[28px] lg:text-[35px] text-[35px]  font-bold text-black mb-1 font-roboto">
        Order List
      </h3>
      <div className="h-0.5  bg-[#A99065] mb-3"></div>

      <div className="border-b-2 pb-4 border-[#A99065]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <input
              type="checkbox"
              id="myRadio1"
              name="myRadioGroup"
              value="option1"
              className="form-checkout w-5 h-5 accent-[#3A7D2C] cursor-pointer"
            />
          </div>
          <div>
            <div className="flex gap-4 items-center">
              <div>
                <Image
                  src={paper}
                  alt="paper"
                  className="2xl:w-full h-full xl:w-10 xl:h-10 lg:w-full lg:h-full"
                />
              </div>
              <div>
                <div className="flex gap-3 items-center">
                  <h5 className=" 2xl:text-[25px] xl:text-[20px]  lg:text-[25px]   font-bold text-black font-roboto">
                    Papper
                  </h5>
                  <small className="text-[15px] font-regular text-black font-roboto">
                    XXXXXX
                  </small>
                </div>
                <div className=" flex">
                  <p className="2xl:text-[25px] xl:text-[20px] lg:text-[25px]  text-[25px]  font-regular text-black font-roboto">
                    Volume:
                  </p>
                  <p className="text-[15px] font-bold text-black  font-roboto border-2 border-[#6D974D] px-2 rounded-[25px] h-[32px]">
                    <span>-</span> xxt <span>+</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="">
              <div className=" mt-1 relative">
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
        </div>
      </div>

      <div className="border-b-2 pb-4 border-[#A99065] mt-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <input
              type="checkbox"
              id="myRadio1"
              name="myRadioGroup"
              value="option1"
              className="form-checkout w-5 h-5 accent-[#3A7D2C] cursor-pointer"
            />
          </div>
          <div>
            <div className="flex gap-4 items-center">
              <div>
                <Image
                  src={wood}
                  alt="wood"
                  className="2xl:w-full h-full xl:w-10 xl:h-10 lg:w-full lg:h-full"
                />
              </div>
              <div>
                <div className="flex gap-3 items-center">
                  <h5 className="2xl:text-[25px] xl:text-[20px] lg:text-[25px]  text-[25px]  font-bold text-black font-roboto">
                    Wood
                  </h5>
                  <small className="text-[15px] font-regular text-black font-roboto">
                    XXXXXX
                  </small>
                </div>
                <div className=" flex">
                  <p className="2xl:text-[25px] xl:text-[20px] lg:text-[25px]  text-[25px]  font-regular text-black font-roboto">
                    Volume:
                  </p>
                  <p className="text-[15px] font-bold text-black  font-roboto border-2 border-[#6D974D] px-2 rounded-[25px] h-[32px]">
                    <span>-</span> xxt <span>+</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="">
              <div className=" mt-1 relative">
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
        </div>
      </div>

      <div className="border-b-2 pb-4 border-[#A99065] mt-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <input
              type="checkbox"
              id="myRadio1"
              name="myRadioGroup"
              value="option1"
              className="form-checkout w-5 h-5 accent-[#3A7D2C] cursor-pointer"
            />
          </div>
          <div>
            <div className="flex gap-4 items-center">
              <div>
                <Image
                  src={paperStart}
                  alt="paperStart"
                  className="2xl:w-full h-full xl:w-10 xl:h-10 lg:w-full lg:h-full"
                />
              </div>
              <div>
                <div className="flex gap-3 items-center">
                  <h5 className="2xl:text-[25px] xl:text-[20px] lg:text-[25px]  text-[25px] font-bold text-black font-roboto">
                    Glass
                  </h5>
                  <small className="text-[15px] font-regular text-black font-roboto">
                    XXXXXX
                  </small>
                </div>
                <div className=" flex">
                  <p className="2xl:text-[25px] xl:text-[20px] lg:text-[25px]  text-[25px] font-regular text-black font-roboto">
                    Volume:
                  </p>
                  <p className="text-[15px] font-bold text-black  font-roboto border-2 border-[#6D974D] px-2 rounded-[25px] h-[32px]">
                    <span>-</span> xxt <span>+</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="">
              <div className=" mt-1 relative">
                <div className="w-full bg-[#D9D9D9] rounded-full h-[18px] mb-1 ">
                  <div
                    className="bg-[#EB5353] h-[18px] rounded-full"
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
        </div>
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

      <button className="w-full bg-[#50704C]  hover:bg-[#50704C] flex justify-around rounded-[5px]">
        <p></p>
        <p className="text-white py-2 rounded-[5px] font-bold text-[24px]">
          Send to Broker
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
