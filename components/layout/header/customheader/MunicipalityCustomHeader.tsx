
interface MunicipalityCustomHeaderProps {
    backgroundImage: string;
    title?: string;
}

const MunicipalityCustomHeader: React.FC<MunicipalityCustomHeaderProps> = ({
    backgroundImage,
    title,
}) => {
    return (
        <div
            className="p-2 text-center h-[50px] rounded-[10px] flex items-center justify-center"
            style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            <h1 className="lg:text-[24px] md:text-[20px]  sm:text-[18px] text-[16px] text-white font-bold tracking-wide font-roboto ">
                {title}
            </h1>
        </div>
    );
};

export default MunicipalityCustomHeader;
