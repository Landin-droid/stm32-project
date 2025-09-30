import React from "react";

const InterfaceSelector = ({ sensor, onSelect }) => {
  return (
    <div className="interface-selector p-4">
      <h2 className="text-xl font-bold mb-4">
        Выберите интерфейс для {sensor.name}:
      </h2>
      <div className="flex gap-4">
        {sensor.interfaces.map((iface) => (
          <button
            key={iface}
            className="bg-blue-500 text-white p-4 rounded hover:bg-blue-600"
            onClick={() => onSelect(iface)}>
            {iface}
          </button>
        ))}
      </div>
    </div>
  );
};

export default InterfaceSelector;