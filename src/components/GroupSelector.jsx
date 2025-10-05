import React from "react";
import { mcuGroups } from "../data/sensors.jsx"; // Импорт mcuGroups, если добавлен

const GroupSelector = ({ sensor, onSelect }) => {
  const interfaceType = sensor.interfaces[0]; // Предполагаем один интерфейс
  const groups = mcuGroups[interfaceType] || {}; // Группы для интерфейса

  return (
    <div className="group-selector p-4">
      <h2 className="text-xl font-bold mb-4 text-center">
        Выберите группу пинов для {sensor.name}:
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.keys(groups).map((group) => (
          <button
            key={group}
            onClick={() => onSelect(group)}
            className="bg-blue-500 text-white p-4 rounded hover:bg-blue-600">
            Группа {group}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GroupSelector;