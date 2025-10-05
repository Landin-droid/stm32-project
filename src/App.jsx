import React, { useState } from "react";
import SensorSelector from "./components/SensorSelector.jsx";
import PinConnector from "./components/PinConnector.jsx";
import "./index.css";

const App = () => {
  const [selectedSensor, setSelectedSensor] =
    useState(null);
  const [connections, setConnections] = useState({});

  const selectSensor = (sensor) => {
    setSelectedSensor(sensor);
    setConnections({});
  };

  const handleConnectionChange = (sensorPin, mcuPin) => {
    setConnections((prev) => ({
      ...prev,
      [sensorPin]: mcuPin,
    }));
  };

  const goBack = () => {
    setSelectedSensor(null);
    setConnections({});
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6">
        Симулятор периферии для STM32F103
      </h1>

      {selectedSensor && (
        <div className="text-center">
          <button
            onClick={goBack}
            className="p-2 bg-gray-300 text-black rounded hover:bg-gray-400">
            Назад к выбору датчика
          </button>
        </div>
      )}

      {!selectedSensor ? (
        <SensorSelector onSelect={selectSensor} />
      ) : (
        <PinConnector
          sensor={selectedSensor}
          connections={connections}
          onConnectionChange={handleConnectionChange}
        />
      )}
    </div>
  );
};

export default App;