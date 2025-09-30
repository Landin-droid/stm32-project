import React, { useState } from "react";
import SensorSelector from "./components/SensorSelector.jsx";
import InterfaceSelector from "./components/InterfaceSelector.jsx";
import PinConnector from "./components/PinConnector.jsx";
import Verification from "./components/Verification.jsx";
import { sensors, mcuPins } from "./data/sensors.jsx";
import "./index.css";

const App = () => {
  const [step, setStep] = useState(1);
  const [selectedSensor, setSelectedSensor] =
    useState(null);
  const [selectedInterface, setSelectedInterface] =
    useState(null);
  const [connections, setConnections] = useState({});
  const [isCorrect, setIsCorrect] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const selectSensor = (sensor) => {
    setSelectedSensor(sensor);
    if (sensor.interfaces.length === 1) {
      setSelectedInterface(sensor.interfaces[0]);
      setStep(3);
    } else {
      setStep(2);
    }
    setConnections({});
    setIsCorrect(null);
    setErrorMessage("");
  };

  const selectInterface = (iface) => {
    setSelectedInterface(iface);
    setStep(3);
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

        // Находим конфигурацию пина в mcuPins
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
    setStep(4);
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      if (step === 3) {
        setConnections({}); // Сброс соединений при возврате с шага 3
        setSelectedSensorPin(null); // Сброс выбранного пина (если нужно)
      } else if (step === 2) {
        setSelectedInterface(null); // Сброс интерфейса при возврате с шага 2
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6">
        Симулятор периферии для STM32F103
      </h1>
      <div className="bg-gray-100 p-4 rounded mb-4 text-black">
        Шаг {step}/4:{" "}
        {
          [
            "Выбор датчика",
            "Выбор интерфейса",
            "Подключение пинов",
            "Проверка",
          ][step - 1]
        }
      </div>

      {4 > step && step > 1 && (
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
        <InterfaceSelector
          sensor={selectedSensor}
          onSelect={selectInterface}
        />
      )}
      {step === 3 &&
        selectedSensor &&
        selectedInterface && (
          <PinConnector
            sensor={selectedSensor}
            interfaceType={selectedInterface}
            connections={connections}
            onConnectionChange={handleConnectionChange}
            onVerify={verifyConnections}
          />
        )}
      {step === 4 && (
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