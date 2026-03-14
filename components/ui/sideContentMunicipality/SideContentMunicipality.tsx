'use client';

import DynamicDropdown from '@/customHooks/component/dynamicDropdown/DynamicDropdown';
import dollarBag from '@/public/assets/images/dollarBag.png';
import lCo2 from '@/public/assets/images/lCo2.png';
import littleTrack from '@/public/assets/images/littleTrack.png';
import paper from '@/public/assets/images/paper.png';
import sideArrow from '@/public/assets/images/sideArrow.png';
import smallBox from '@/public/assets/images/smallBox.png';
import { WasteBatch } from '@/types/besse';
import Image from 'next/image';
import React from 'react';
import { toast } from 'react-toastify';

interface SideContentMunicipalityProps {
  budget?: number;
  totalCO2?: number;
  inventory?: number;
  selectedBatch?: WasteBatch | null;
  handleCollectWaste?: () => void;
}

export const SideContentMunicipality: React.FC<SideContentMunicipalityProps> = ({
  budget = 0,
  totalCO2 = 0,
  inventory = 0,
  selectedBatch,
  handleCollectWaste,
}) => {
  const volumeOptions = ['volume', 'volume 2', 'volume 3'];
  const handleSelectVolume = (value: string) => {
    console.log('Selected option:', value);
  };

  const sendOptions = ['MRF'];
  const handleSelectSend = (value: string) => {
    // console.log("Selected option:", value);
  };

  const dumpOptions = ['Landfill ', 'Landfill  2', 'Landfill  3'];
  const handleSelectDump = (value: string) => {
    // console.log("Selected option:", value);
  };
  return (
    <div className="lg:mb-0 mb-14">
      <div className="bg-white border-4 border-dashed border-[#b18c5a] rounded-md p-4 ">
        <h3 className="text-center 2xl:text-[35px] xl:text-[28px] lg:text-[35px] text-[35px] font-bold text-black mb-1">
          Waste Action
        </h3>
        <div className="h-0.5 mx-4 bg-[#A99065] mb-3"></div>

        {/* Paper Section */}
        <div className="flex justify-center gap-4 mt-6">
          <Image src={paper} alt="paper" />
          <h4 className="2xl:text-[35px] xl:text-[28px] lg:text-[35px] text-[35px] font-bold text-black mb-1 font-roboto">
            {selectedBatch ? `${Number(selectedBatch.mass).toFixed(2)} t` : '0.00 t'}
          </h4>
        </div>

        {/* Volume Dropdown */}
        {/* <div className="my-4 flex justify-center items-center">
          <DynamicDropdown options={volumeOptions} onSelect={handleSelectVolume} disabled={true} />
        </div> */}

        {/* Send To Dropdown */}
        <div className="flex justify-between my-3">
          <div className="flex items-center">
            <input
              type="radio"
              id="sendTo"
              name="action"
              value="send"
              className="form-radio w-5 h-5 accent-[#3A7D2C] cursor-pointer"
              defaultChecked
            />
            <label
              htmlFor="sendTo"
              className="ml-2 2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px]  font-bold text-black font-roboto"
            >
              Send to
            </label>
          </div>

          <DynamicDropdown
            options={sendOptions}
            onSelect={handleSelectSend}
            disabled={true}
            showOptionIcon={false}
          />
        </div>
        {/* Dump To Dropdown */}
        {/* <div className="flex justify-between">
          <div className="flex items-center">
            <input
              type="radio"
              id="dumpTo"
              name="action"
              value="dump"
              className="form-radio w-5 h-5 accent-[#3A7D2C] cursor-pointer"
              disabled
            />
            <label
              htmlFor="dumpTo"
              className="ml-2 2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px] font-bold text-black font-roboto"
            >
              Dump to
            </label>
          </div>
          <DynamicDropdown options={dumpOptions} onSelect={handleSelectDump} disabled={true} />
        </div> */}

        {/* Budget, CO2, Material Quality */}
        <div className="mb-5 mt-5 space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <Image src={dollarBag} alt="dollarBag" className="w-6 h-6" />
              <p className="2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px] font-bold text-black font-roboto">
                Budget
              </p>
            </div>
            <p className="2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px] font-normal text-black font-roboto">
              ${Number(budget).toFixed(2)}
            </p>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <Image src={lCo2} alt="lCo2" className="w-6 h-6" />
              <p className="2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px] font-bold text-black font-roboto">
                CO₂
              </p>
            </div>
            <p className="2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px] font-normal text-black font-roboto">
              + {Number(totalCO2).toFixed(2)}t
            </p>
          </div>

          {/* <div className="flex justify-between items-center">
                        <div className="flex gap-2 items-center">
                            <Image src={stars} alt="stars" className="w-6 h-6" />
                            <p className="2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px] font-bold text-black font-roboto">
                                Material Quality
                            </p>
                        </div>
                        <p className="text-[20px] font-normal text-black font-roboto">
                            +/- xx%
                        </p>
                    </div> */}

          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <Image src={smallBox} alt="smallBox" className="w-6 h-6" />
              <p className="2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px] font-bold text-black font-roboto">
                Mass
              </p>
            </div>
            <p className="text-[20px] font-normal text-black font-roboto">
              {Number(inventory).toFixed(2)}t
            </p>
          </div>
        </div>

        {/* Confirm Section */}
        <div className="flex gap-4">
          <div className="flex items-center gap-1">
            <Image src={littleTrack} alt="littleTrack" className="w-10 h-6" />
            <Image src={littleTrack} alt="littleTrack" className="w-10 h-6" />
            <Image src={littleTrack} alt="littleTrack" className="w-10 h-6" />
          </div>
          <button
            onClick={() => {
              if (selectedBatch?.id) {
                handleCollectWaste && handleCollectWaste();
              } else {
                toast.error('Select a waste batch');
              }
            }}
            className="px-2 rounded-[5px] bg-[#6D974D] flex gap-4"
          >
            <p className="text-white py-2 font-bold 2xl:text-[24px]  xl:text-[16px] lg:text-[24px] text-[24px]">
              Confirm
            </p>
            <div className="flex items-center">
              <div className="bg-[#C0D066] w-[33px]  h-[33px]  rounded-full flex justify-center items-center">
                <Image src={sideArrow} alt="sideArrow" />
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Truck Fleet Section */}
      <div>
        <h2 className="text-center mt-4 mb-2 font-roboto font-bold 2xl:text-[25px] xl:text-[20px] md:text-[25px] text-[25px] text-black">
          Truck Fleet
        </h2>
        <div className="flex justify-start gap-2">
          <p className="font-roboto 2xl:text-[25px] xl:text-[20px] md:text-[25px] text-[25px]  text-black">
            Active :
          </p>
          <div className="flex gap-2">
            <Image src={littleTrack} alt="littleTrack" className="w-10 h-6" />
            <Image src={littleTrack} alt="littleTrack" className="w-10 h-6" />
            <Image src={littleTrack} alt="littleTrack" className="w-10 h-6" />
            <Image src={littleTrack} alt="littleTrack" className="w-10 h-6" />
          </div>
        </div>
        <div className="flex justify-start gap-2">
          <p className="font-roboto 2xl:text-[25px] xl:text-[20px] md:text-[25px] text-[25px] text-black">
            In Use :
          </p>
          <div className="flex gap-2">
            <Image src={littleTrack} alt="littleTrack" className="w-10 h-6" />
            <Image src={littleTrack} alt="littleTrack" className="w-10 h-6" />
            <Image src={littleTrack} alt="littleTrack" className="w-10 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
};
