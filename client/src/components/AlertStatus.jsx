import alertBg from "../assets/alert.png";
const AlertStatus = function ({ status }) {
  const getStatusColor = () => {
    if (status) return "bg-green-500";
    else return "bg-red-500";
  };

  return (
    <div
      className="flex items-center justify-center gap-3 p-1 bg-gray-300 text-white rounded-lg shadow-md w-[110%] h-30"
      style={{
        backgroundImage: `url(${alertBg})`,
        backgroundSize: "100% 100%", // stretches image to fill container
        backgroundRepeat: "no-repeat", // prevent tiling
        backgroundPosition: "center",
        borderRadius: "20px",
      }}
    >
      {/* <div
        className={`w-4 h-4 rounded-full ${getStatusColor()} animate-pulse`}
      /> */}
      <p className="text-sm font-medium">
        {status ? "Great! Keep looking straight!" : "adjust your position"}
      </p>
    </div>
  );
};

export default AlertStatus;
