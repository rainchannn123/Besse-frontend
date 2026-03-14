'use client';

import rightSideArrow from '@/public/assets/images/arrow.png';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React from 'react';

export const MemberHeader: React.FC = () => {
  const router = useRouter();
  const handleBack = () => {
    router.back();
  };
  return (
    <div className="bg-[#6D974D] py-4">
      <div className="max-w-[1550px] mx-auto flex  sm:flex-row items-center justify-between px-4 sm:px-8 gap-4 sm:gap-0">
        {/* Back Button */}
        <div className="md:flex hidden justify-center sm:justify-start w-full sm:w-auto">
          <button
            onClick={handleBack}
            className="flex items-center lg:gap-20 md:gap-10 gap-20 bg-white px-4 py-2 rounded-[5px] transition-transform hover:scale-105"
            style={{ boxShadow: '0 3px 7px #E3DBCA' }}
          >
            <div className="bg-[#C0D066] w-[38px] h-[38px] flex justify-center items-center rounded-full">
              <Image src={rightSideArrow} alt="rightSideArrow" />
            </div>
            <p className="text-[#6D924B] font-bold text-[20px] sm:text-[24px] font-roboto">Back</p>
          </button>
        </div>

        {/* Center Title */}
        <div className="flex  text-center sm:text-left">
          {/* <h1 className="font-bold text-[18px] sm:text-[27px] md:text-[40px] font-roboto text-white">
            Besse
          </h1> */}
        </div>

        {/* User Info */}
        <div className="flex items-center md:justify-center justify-end  sm:w-auto gap-4">
          {/* <div className="">
                        <p className="text-white text-[14px] sm:text-[22px] md:text-[25px] font-roboto font-normal">
                            @123ABC
                        </p>
                        <p className="text-white text-[14px] sm:text-[22px] md:text-[25px] font-roboto font-normal">
                            Municipality
                        </p>
                    </div>
                    <div className="flex items-center justify-center">
                        <Image
                            src={userInfo}
                            alt="userInfo"
                        />
                    </div> */}
        </div>
      </div>
    </div>
  );
};
