import React from "react";
import { sensors } from "../data/sensors.jsx";

const SensorSelector = ({ onSelect }) => {
  return (
    <div className="sensor-selector p-4">
      <h2 className="text-xl font-bold mb-4 text-center">
        Выберите датчик:
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 justify-items-center">
        {sensors.map((sensor) => (
          <button
            key={sensor.name}
            className="flex flex-col items-center bg-blue-500 text-white p-4 rounded hover:bg-blue-600 w-full max-w-xs transition-colors"
            onClick={() => onSelect(sensor)}>
            <img
              src={sensor.image}
              alt={sensor.name}
              className="w-20 h-20 sm:w-30 sm:h-30 object-contain mb-2"
            />
            <span>{sensor.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SensorSelector;