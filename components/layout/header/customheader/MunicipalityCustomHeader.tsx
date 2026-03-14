
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
            className="p-3 text-center h-[83px] rounded-[10px] flex items-center justify-center"
            style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            <h1 className="lg:text-[36px] md:text-[28px]  sm:text-[24px] text-[22px] text-white font-bold tracking-wide font-roboto ">
                {title}
            </h1>
        </div>
    );
};

export default MunicipalityCustomHeader;
