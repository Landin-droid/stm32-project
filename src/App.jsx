import React, { useState } from "react";
import SensorSelector from "./components/SensorSelector.jsx";
import PinConnector from "./components/PinConnector.jsx";
import Verification from "./components/Verification.jsx";
import { sensors, mcuPins } from "./data/sensors.jsx";
import "./index.css";

const App = () => {
  const [step, setStep] = useState(1);
  const [selectedSensor, setSelectedSensor] =
    useState(null);
  const [connections, setConnections] = useState({});
  const [isCorrect, setIsCorrect] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const selectSensor = (sensor) => {
    setSelectedSensor(sensor);
    setStep(2); // Переход к подключению пинов
    setConnections({});
    setIsCorrect(null);
    setErrorMessage("");
  };

  const handleConnectionChange = (sensorPin, mcuPin) => {
    setConnections((prev) => ({
      ...prev,
      [sensorPin]: mcuPin,
    }));
  };

  const verifyConnections = () => {
    let correct = true;
    let errors = [];
    Object.keys(selectedSensor.correctConnections).forEach(
      (sensorPin) => {
        const requiredType =
          selectedSensor.correctConnections[sensorPin];
        const selectedMcuPin = connections[sensorPin];
        if (!selectedMcuPin) {
          correct = false;
          errors.push(`Ошибка: ${sensorPin} не подключён`);
          return;
        }

        const mcuPinConfig = Object.values(mcuPins).find(
          (pin) => pin.name === selectedMcuPin
        );
        if (
          !mcuPinConfig ||
          !mcuPinConfig.functions.includes(requiredType)
        ) {
          correct = false;
          errors.push(
            `Ошибка: ${sensorPin} должен быть подключён к пину с функцией ${requiredType} (текущий пин: ${selectedMcuPin})`
          );
        }
      }
    );
    setIsCorrect(correct);
    setErrorMessage(correct ? "" : errors.join("\n"));
    setStep(3);
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      if (step === 2) {
        setConnections({});
        setSelectedSensor(null); // Сброс датчика при возврате с шага 2
      }
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold text-center mb-6">
        Симулятор периферии для STM32F103
      </h1>

      {step > 1 && (
        <div className="text-center mb-4">
          <button
            onClick={goBack}
            className="p-2 bg-gray-300 text-black rounded hover:bg-gray-400">
            Назад
          </button>
        </div>
      )}

      {step === 1 && (
        <SensorSelector onSelect={selectSensor} />
      )}
      {step === 2 && selectedSensor && (
        <PinConnector
          sensor={selectedSensor}
          connections={connections}
          onConnectionChange={handleConnectionChange}
          onVerify={verifyConnections}
        />
      )}
      {step === 3 && (
        <Verification
          isCorrect={isCorrect}
          errorMessage={errorMessage}
          onRestart={() => setStep(1)}
        />
      )}
    </div>
  );
};

export default App;