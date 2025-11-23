const ServerStatus = function ({ status }) {
  const getStatusColor = () => {
    if (status === "connected to server") return "bg-green-500";
    if (status === "error") return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="flex items-center justify-around text-left gap-2 p-1 border border-green-400 bg-[#0080009d] rounded-lg shadow-md w-[110%]  text-green-300">
      <div
        className={`w-4 h-4 rounded-full ${getStatusColor()} animate-pulse`}
      />
      <p className="text-sm font-medium">{status}</p>
    </div>
  );
};

export default ServerStatus;
