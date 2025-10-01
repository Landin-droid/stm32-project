import React, { useState, useRef, useEffect } from "react";
import {
  Stage,
  Layer,
  Image,
  Circle,
  Rect,
  Text,
  Line,
} from "react-konva";
import { mcuPins } from "../data/sensors.jsx";

const PinConnector = ({
  sensor,
  interfaceType,
  connections,
  onConnectionChange,
  onVerify,
}) => {
  const [selectedSensorPin, setSelectedSensorPin] =
    useState(null);
  const [lines, setLines] = useState([]);
  const stageRef = useRef();
  const imageRef = useRef();

  // Загрузка фото датчика с отладкой
  useEffect(() => {
    const image = new window.Image();
    image.src = sensor.imageTopView;
    image.onload = () => {
      console.log(
        `Изображение ${sensor.imageTopView} загружено успешно`
      );
      if (imageRef.current) {
        imageRef.current.image(image);
        imageRef.current.getLayer().batchDraw();
      } else {
        console.error("imageRef.current is null");
      }
    };
    image.onerror = () => {
      console.error(
        `Ошибка загрузки изображения: ${sensor.imageTopView}`
      );
    };
    return () => {
      image.onload = null; // Очистка события при размонтировании
      image.onerror = null;
    };
  }, [sensor.imageTopView]);

  const allPinsConnected = sensor.pins.every(
    (pin) => connections[pin]
  );

  // Обработчик клика по пину датчика
  const handleSensorPinClick = (sensorPin) => {
    setSelectedSensorPin(sensorPin);
  };

  // Обработчик клика по пину MCU
  const handleMcuPinClick = (mcuPin) => {
    if (selectedSensorPin) {
      onConnectionChange(selectedSensorPin, mcuPin);
      setSelectedSensorPin(null);

      const newLine = {
        sensorPin: selectedSensorPin,
        mcuPin: mcuPin,
        points: calculateLinePoints(
          selectedSensorPin,
          mcuPin
        ),
      };
      setLines([...lines, newLine]);
    }
  };

  // Функция для расчета координат линии
  const calculateLinePoints = (sensorPin, mcuPin) => {
    const sensorPosition = sensor.pinPositions[
      sensorPin
    ] || [150, 110]; // Значение по умолчанию
    const mcuPosition = calculateMcuPinPosition(mcuPin);

    return [
      sensorPosition[0] + 50,
      sensorPosition[1],
      mcuPosition[0],
      mcuPosition[1],
    ]; // Смещение для линии от фото
  };

  // Компонент пина датчика (круг на фото)
  const SensorPin = ({ pin, position }) => {
    if (!position) {
      console.error(`Позиция для пина ${pin} не найдена`);
      position = [150, 110]; // Значение по умолчанию, если позиция отсутствует
    }
    return (
      <Circle
        x={position[0] + 50} // Смещение относительно фото
        y={position[1]}
        radius={8}
        fill={
          selectedSensorPin === pin
            ? "#3b82f6"
            : "transparent"
        }
        stroke="#10b981"
        strokeWidth={2}
        onClick={() => handleSensorPinClick(pin)}
        onMouseEnter={(e) => {
          e.target.scale({ x: 1.2, y: 1.2 });
          stageRef.current.container().style.cursor =
            "pointer";
        }}
        onMouseLeave={(e) => {
          e.target.scale({ x: 1, y: 1 });
          stageRef.current.container().style.cursor =
            "default";
        }}
      />
    );
  };

  // Компонент пина MCU
  const McuPin = ({ pin, position, isConnected }) => (
    <Circle
      x={position[0]}
      y={position[1]}
      radius={8}
      fill={isConnected ? "#10b981" : "transparent"}
      stroke={isConnected ? "#10b981" : "#3b82f6"}
      strokeWidth={2}
      onClick={() => handleMcuPinClick(pin)}
      onMouseEnter={(e) => {
        e.target.scale({ x: 1.2, y: 1.2 });
        stageRef.current.container().style.cursor =
          "pointer";
      }}
      onMouseLeave={(e) => {
        e.target.scale({ x: 1, y: 1 });
        stageRef.current.container().style.cursor =
          "default";
      }}
    />
  );

  return (
    <div className="pin-connector p-4">
      <h2 className="text-xl font-bold mb-4 text-center">
        Подключите пины для {sensor.name} ({interfaceType}):
      </h2>
      <p className="mb-4 text-center">
        Кликните на пин датчика (зелёный), затем на пин
        STM32 (синий) для соединения.
        {selectedSensorPin && (
          <span className="text-blue-600 ml-2">
            Выбран: {selectedSensorPin}
          </span>
        )}
      </p>
      <div className="flex justify-center">
        <Stage
          width={700}
          height={500}
          ref={stageRef}
          className="border rounded shadow-lg">
          <Layer>
            {/* Фото датчика */}
            <Image
              ref={imageRef}
              x={50}
              y={100}
              width={200}
              height={200}
              cornerRadius={5}
            />
            <Text
              x={130}
              y={110}
              text={sensor.name}
              fontSize={14}
              align="center"
              width={150}
            />
            {/* Пины датчика (на фото, без текста) */}
            {sensor.pins.map((pin, index) => (
              <SensorPin
                key={pin}
                pin={pin}
                position={sensor.pinPositions[pin]}
              />
            ))}

            {/* Примерная схема микроконтроллера */}
            <Rect
              x={350}
              y={50}
              width={300}
              height={440}
              fill="#e2e8f0"
              stroke="#1f2937"
              strokeWidth={2}
              cornerRadius={10}
            />
            <Text
              x={500}
              y={60}
              text="STM32F103"
              fontSize={14}
              align="center"
              width={150}
            />

            {/* Пины MCU */}
            {Object.keys(mcuPins).map((pin) => {
              const position = calculateMcuPinPosition(pin);
              const isConnected =
                connections[
                  sensor.pins.find(
                    (p) => connections[p] === pin
                  )
                ];
              return (
                <React.Fragment key={pin}>
                  <McuPin
                    pin={pin}
                    position={position}
                    isConnected={isConnected}
                  />
                  <Text
                    x={position[0] + 20}
                    y={position[1] - 5}
                    text={`${pin} (${mcuPins[
                      pin
                    ].functions.join(", ")})`}
                    fontSize={14}
                    fill="black"
                    align="right"
                  />
                </React.Fragment>
              );
            })}

            {/* Линии соединений */}
            {Object.entries(connections).map(
              ([sensorPin, mcuPin]) => {
                const points = calculateLinePoints(
                  sensorPin,
                  mcuPin
                );
                return (
                  <Line
                    key={`${sensorPin}-${mcuPin}`}
                    points={points}
                    stroke="#10b981"
                    strokeWidth={2}
                    lineCap="round"
                    lineJoin="round"
                    dash={[5, 5]}
                  />
                );
              }
            )}
          </Layer>
        </Stage>
      </div>
      <div className="text-center mt-4">
        <button
          disabled={!allPinsConnected}
          onClick={onVerify}
          className={`p-2 rounded ${
            allPinsConnected
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}>
          Проверить подключение
        </button>
      </div>
    </div>
  );

  // Функция для расчета позиций пинов датчика
  function calculateSensorPinPosition(pin) {
    const baseX = 150;
    const baseY = 120;
    const pinIndex = sensor.pins.indexOf(pin);
    return [baseX, baseY + pinIndex * 50];
  }

  // Функция для расчета позиций пинов MCU
  function calculateMcuPinPosition(pin) {
    const baseX = 390;
    const baseY = 100;
    const pinOrder = {
      GND: 0,
      VCC: 1,
      PA0: 2,
      PA1: 3,
      PA2: 4,
      PA3: 5,
      PA4: 6,
      PB0: 7,
      PB1: 8,
      PB6: 9,
      PB7: 10,
      PB8: 11,
      PB9: 12,
    };
    const index = pinOrder[pin] || 0;
    return [baseX, baseY + index * 30];
  }
};

export default PinConnector;