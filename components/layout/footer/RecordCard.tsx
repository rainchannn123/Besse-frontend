import React from 'react';
import Image from "next/image";
import pin from "@/public/assets/images/pin.png";
interface RecordItemProps {
    timestamp: string;
    description: string;
}

const recordData: RecordItemProps[] = [
    {
        timestamp: '[01 Nov 2025 | 09:58 am]',
        description: 'Municipality received 12 tons Paper from Broker',
    },
    {
        timestamp: '[01 Nov 2025 | 10:00 am]',
        description: 'Broker sent 12 tons Waste to MRF',
    },
];

const RecordItem: React.FC<RecordItemProps> = ({ timestamp, description }) => (
    <div className="mb-4">
        <p className="text-[24px] font-roboto text-black font-medium underline ">{timestamp}</p>
        <p className="text-[24px] font-roboto text-black font-normal">{description}</p>
    </div>
);


const RecordCard: React.FC = () => {
    return (
        <div className='flex justify-start'>
            <div className="w-[385px] border border-gray-300 rounded-lg shadow-lg bg-white ">
                <div className="bg-[#D22E2E] text-white p-1 relative flex items-center justify-center">
                    <div
                        className="absolute left-3 top-[-40px] ">
                        <Image src={pin} alt="pin" />

                    </div>
                    <h2 className="text-[35px] font-bold font-roboto text-white ml-10">Record</h2>
                </div>
                <div className="p-4 bg-gray-50">
                    {recordData.map((item, index) => (
                        <RecordItem
                            key={index}
                            timestamp={item.timestamp}
                            description={item.description}
                        />
                    ))}
                </div>
            </div>
        </div>

    );
};

export default RecordCard;