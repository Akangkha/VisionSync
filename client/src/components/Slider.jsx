const MazeSizeSlider = ({ min = 5, max = 30, size, handleSizeChange }) => {
  return (
    <div className="flex flex-col items-center gap-3 w-[60%] justify-center mt-4">
      <input
        type="range"
        min={min}
        max={max}
        value={size}
        onChange={handleSizeChange}
        className="w-full accent-emerald-500"
      />
      <label className="text-emerald-400 font-bold text-sm">
        Difficulty level: {size}
      </label>
    </div>
  );
};

export default MazeSizeSlider;
