import React, { useState, useEffect, useRef } from "react";
import {
  Stage,
  Layer,
  Image,
  Circle,
  Rect,
  Text,
  Line,
} from "react-konva";
import { mcuPins, mcuGroups } from "../data/sensors.jsx";

const PinConnector = ({
  sensor,
  connections,
  onConnectionChange,
}) => {
  const [selectedSensorPin, setSelectedSensorPin] =
    useState(null);
  const [lines, setLines] = useState([]);
  const [verificationResult, setVerificationResult] =
    useState(null);
  const [openGroup, setOpenGroup] = useState(null); // Теперь только одна открытая группа
  const stageRef = useRef();
  const imageRef = useRef();

  // Функция для расчета позиции группы
  const calculateGroupPosition = (group) => {
    const leftGroups = ["A", "B"];
    const rightGroups = ["C", "D"];

    if (leftGroups.includes(group)) {
      const baseX = 190;
      const baseY = 310;
      const index = leftGroups.indexOf(group);
      return [baseX, baseY + index * 100];
    } else if (rightGroups.includes(group)) {
      const baseX = 450;
      const baseY = 310;
      const index = rightGroups.indexOf(group);
      return [baseX, baseY + index * 100];
    }
    return [60, 310];
  };

  // Функция для расчета позиции пина MCU внутри группы
  const calculateMcuPinPosition = (mcuPin, group) => {
    const groupPosition = calculateGroupPosition(group);
    const pinsInGroup =
      mcuGroups[sensor.interfaces[0]][group];
    const pinIndex = pinsInGroup.indexOf(mcuPin);

    const leftGroups = ["A", "B"];
    const rightGroups = ["C", "D"];

    if (leftGroups.includes(group)) {
      // Для левых групп пины располагаются снизу
      return [
        groupPosition[0] - 10 + pinIndex * 30, // Равномерно распределяем по ширине группы
        groupPosition[1] + 60, // Снизу от группы
      ];
    } else if (rightGroups.includes(group)) {
      // Для правых групп пины также располагаются снизу
      return [
        groupPosition[0] - 10 + pinIndex * 30,
        groupPosition[1] + 60,
      ];
    }

    return [
      groupPosition[0] + 30 + pinIndex * 40,
      groupPosition[1] + 50,
    ];
  };

  useEffect(() => {
    const image = new window.Image();
    image.src = sensor.imageTopView;
    image.onload = () => {
      if (imageRef.current) {
        imageRef.current.image(image);
        imageRef.current.getLayer().batchDraw();
      }
    };
  }, [sensor.imageTopView]);

  // Проверка подключений при каждом изменении
  useEffect(() => {
    checkConnections();
  }, [connections]);

  const checkConnections = () => {
    let isCorrect = true;
    let errors = [];

    // Проверяем, все ли пины подключены
    const allPinsConnected = sensor.pins.every(
      (pin) => connections[pin]
    );
    if (!allPinsConnected) {
      isCorrect = false;
      errors.push("Не все пины датчика подключены");
    }

    // Проверяем правильность подключения каждого пина
    Object.keys(sensor.correctConnections).forEach(
      (sensorPin) => {
        const requiredType =
          sensor.correctConnections[sensorPin];
        const selectedMcuPin = connections[sensorPin];

        if (!selectedMcuPin) {
          isCorrect = false;
          errors.push(`Пин ${sensorPin} не подключён`);
          return;
        }

        const mcuPinConfig = Object.values(mcuPins).find(
          (pin) => pin.name === selectedMcuPin
        );

        if (
          !mcuPinConfig ||
          !mcuPinConfig.functions.includes(requiredType)
        ) {
          isCorrect = false;
          errors.push(
            `Пин ${sensorPin} должен быть ${requiredType}, но подключён к ${selectedMcuPin}`
          );
        }
      }
    );

    setVerificationResult({
      isCorrect,
      errors,
      allPinsConnected,
    });
  };

  const handleSensorPinClick = (sensorPin) => {
    setSelectedSensorPin(sensorPin);
    console.log(
      "=== КЛИК ПО ДАТЧИКУ ===",
      sensorPin,
      "Состояние selectedSensorPin:",
      selectedSensorPin
    );
  };

  const handleMcuPinClick = (mcuPin) => {
    console.log(
      "=== КЛИК ПО MCU ===",
      mcuPin,
      "Выбран датчик:",
      selectedSensorPin
    );
    if (selectedSensorPin) {
      console.log(
        "Соединение:",
        selectedSensorPin,
        "с",
        mcuPin
      );
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
      console.log("Новая линия:", newLine);
      setLines([...lines, newLine]);
    } else {
      console.log("Ошибка: Нет выбранного датчика!");
    }
  };

  // Обработчик клика по группе - теперь может быть открыта только одна группа
  const toggleGroup = (group) => {
    console.log(
      "Тоггл группы:",
      group,
      "Текущая открытая группа:",
      openGroup
    );
    setOpenGroup((prev) => {
      if (prev === group) {
        return null; // Закрыть группу если кликнули на ту же
      } else {
        return group; // Открыть новую группу
      }
    });
  };

  const calculateLinePoints = (sensorPin, mcuPin) => {
    const sensorPosition = sensor.pinPositions[
      sensorPin
    ] || [150, 110];
    let group = mcuPin.match(/P([A-D])/)?.[1] || "A";

    if (mcuPin === "GND" || mcuPin === "VCC") {
      group = "D";
    }

    if (openGroup !== group) {
      // Если группа закрыта, линия ведёт к центру группы
      const groupPosition = calculateGroupPosition(group);
      const points = [
        sensorPosition[0] + 50,
        sensorPosition[1],
        groupPosition[0] + 90, // Центр группы по X
        groupPosition[1] + 20, // Центр группы по Y
      ];
      console.log("Линия к группе:", points);
      return points;
    }

    // Если группа открыта, линия ведёт к пину
    const mcuPosition = calculateMcuPinPosition(
      mcuPin,
      group
    );
    const points = [
      sensorPosition[0] + 50,
      sensorPosition[1],
      mcuPosition[0],
      mcuPosition[1],
    ];
    console.log("Линия к пину:", points);
    return points;
  };

  const SensorPin = ({ pin, position }) => {
    console.log("Рендер пина датчика:", pin, position);
    if (!position) {
      console.error(`Позиция для пина ${pin} не найдена`);
      position = [150, 110];
    }
    return (
      <Circle
        x={position[0] + 50}
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

  const McuPin = ({ pin, position, isConnected }) => {
    console.log("Рендер пина MCU:", pin, position);
    return (
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
  };

  const interfaceType = sensor.interfaces[0];
  const groups = mcuGroups[interfaceType] || {};

  // Разделяем группы на левые и правые
  const leftGroups = ["A", "B"].filter(
    (group) => groups[group]
  );
  const rightGroups = ["C", "D"].filter(
    (group) => groups[group]
  );

  const connectedPinsCount = Object.keys(
    connections
  ).filter((pin) => connections[pin]).length;
  const totalPinsCount = sensor.pins.length;

  return (
    <div className="pin-connector p-4">
      <div className="flex flex-row justify-around">
        <div className="flex">
          <Stage
            width={800}
            height={550} // Увеличена высота для размещения пинов снизу
            ref={stageRef}
            className="border rounded shadow-lg">
            <Layer>
              {/* Фото датчика сверху */}
              <Image
                ref={imageRef}
                x={300}
                y={20}
                width={200}
                height={200}
                cornerRadius={5}
              />

              {/* Пины датчика */}
              {sensor.pins.map((pin, index) => (
                <SensorPin
                  key={pin}
                  pin={pin}
                  position={sensor.pinPositions[pin]}
                />
              ))}

              {/* Контейнер микроконтроллера */}
              <Rect
                x={150}
                y={250}
                width={500}
                height={290}
                fill="#e2e8f0"
                stroke="#1f2937"
                strokeWidth={2}
                cornerRadius={10}
              />
              <Text
                x={490}
                y={270}
                text="STM32F103"
                fontSize={14}
                align="center"
                width={200}
              />

              {/* Левые группы (A, B) */}
              {leftGroups.map((group, index) => (
                <React.Fragment key={group}>
                  <Rect
                    x={170}
                    y={310 + index * 100}
                    width={200}
                    height={40}
                    fill={
                      openGroup === group
                        ? "#f3f4f6"
                        : "#d1d5db"
                    }
                    stroke="#1f2937"
                    strokeWidth={2}
                    cornerRadius={5}
                    onClick={() => toggleGroup(group)}
                    onMouseEnter={(e) => {
                      e.target.fill("#e5e7eb");
                      stageRef.current.container().style.cursor =
                        "pointer";
                    }}
                    onMouseLeave={(e) => {
                      e.target.fill(
                        openGroup === group
                          ? "#f3f4f6"
                          : "#d1d5db"
                      );
                      stageRef.current.container().style.cursor =
                        "default";
                    }}
                  />
                  <Text
                    x={170}
                    y={320 + index * 100}
                    text={`Группа ${group}`}
                    fontSize={14}
                    align="center"
                    width={100}
                  />

                  {/* Пины группы (появляются снизу когда группа открыта) */}
                  {openGroup === group && (
                    <React.Fragment>
                      {groups[group].map(
                        (mcuPin, pinIndex) => {
                          const position =
                            calculateMcuPinPosition(
                              mcuPin,
                              group
                            );
                          const isConnected =
                            connections[
                              sensor.pins.find(
                                (p) =>
                                  connections[p] === mcuPin
                              )
                            ];
                          return (
                            <React.Fragment key={mcuPin}>
                              <McuPin
                                pin={mcuPin}
                                position={position}
                                isConnected={isConnected}
                              />
                              <Text
                                x={position[0] - 15}
                                y={position[1] + 15}
                                text={mcuPin}
                                fontSize={12}
                                fill="black"
                                align="center"
                                width={30}
                              />
                            </React.Fragment>
                          );
                        }
                      )}
                    </React.Fragment>
                  )}
                </React.Fragment>
              ))}

              {/* Правые группы (C, D) */}
              {rightGroups.map((group, index) => (
                <React.Fragment key={group}>
                  <Rect
                    x={430}
                    y={310 + index * 100}
                    width={200}
                    height={40}
                    fill={
                      openGroup === group
                        ? "#f3f4f6"
                        : "#d1d5db"
                    }
                    stroke="#1f2937"
                    strokeWidth={2}
                    cornerRadius={5}
                    onClick={() => toggleGroup(group)}
                    onMouseEnter={(e) => {
                      e.target.fill("#e5e7eb");
                      stageRef.current.container().style.cursor =
                        "pointer";
                    }}
                    onMouseLeave={(e) => {
                      e.target.fill(
                        openGroup === group
                          ? "#f3f4f6"
                          : "#d1d5db"
                      );
                      stageRef.current.container().style.cursor =
                        "default";
                    }}
                  />
                  <Text
                    x={430}
                    y={320 + index * 100}
                    text={`Группа ${
                      group === "D" ? "Others" : "C"
                    }`}
                    fontSize={14}
                    align="center"
                    width={100}
                  />

                  {/* Пины группы (появляются снизу когда группа открыта) */}
                  {openGroup === group && (
                    <React.Fragment>
                      {groups[group].map(
                        (mcuPin, pinIndex) => {
                          const position =
                            calculateMcuPinPosition(
                              mcuPin,
                              group
                            );
                          const isConnected =
                            connections[
                              sensor.pins.find(
                                (p) =>
                                  connections[p] === mcuPin
                              )
                            ];
                          return (
                            <React.Fragment key={mcuPin}>
                              <McuPin
                                pin={mcuPin}
                                position={position}
                                isConnected={isConnected}
                              />
                              <Text
                                x={position[0] - 15}
                                y={position[1] + 15}
                                text={mcuPin}
                                fontSize={12}
                                fill="black"
                                align="center"
                                width={30}
                              />
                            </React.Fragment>
                          );
                        }
                      )}
                    </React.Fragment>
                  )}
                </React.Fragment>
              ))}

              {/* Линии соединений */}
              {Object.entries(connections).map(
                ([sensorPin, mcuPin]) => {
                  const points = calculateLinePoints(
                    sensorPin,
                    mcuPin
                  );
                  console.log(
                    "Рендер линии:",
                    sensorPin,
                    mcuPin,
                    points
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

        <div className="flex flex-col">
          {/* Инструкция */}
          <div className="p-4 mb-4 bg-yellow-50 rounded border border-yellow-200 text-black">
            <h3 className="font-bold mb-2">
              Как подключить:
            </h3>
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li>Нажмите на зелёный круг (пин датчика)</li>
              <li>Нажмите на синий круг (пин STM32)</li>
              <li>Повторите для всех пинов датчика</li>
              <li>Проверка выполняется автоматически</li>
            </ol>
          </div>

          {/* Прогресс подключения */}
          <div className="p-4 mb-4 bg-blue-50 rounded text-black">
            <h3 className="font-bold mb-2">
              Статус подключения:
            </h3>
            <p className="text-sm mb-2">
              Подключено: {connectedPinsCount} из{" "}
              {totalPinsCount} пинов
            </p>
            <div className="w-full bg-gray-500 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    (connectedPinsCount / totalPinsCount) *
                    100
                  }%`,
                }}></div>
            </div>
          </div>

          {/* Статус проверки */}
          {verificationResult && (
            <div
              className={`p-4 rounded-lg text-center ${
                verificationResult.isCorrect
                  ? "bg-green-100 border border-green-400 text-green-700"
                  : "bg-red-100 border border-red-400 text-red-700"
              }`}>
              {verificationResult.isCorrect ? (
                <div>
                  <div className="flex items-center justify-center mb-2">
                    <svg
                      className="w-6 h-6 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-lg font-semibold">
                      Всё подключено правильно! Отличная
                      работа! 🎉
                    </span>
                  </div>
                  <p className="text-sm">
                    Все пины датчика подключены к правильным
                    выводам STM32
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="font-bold mb-2">
                    Требуется исправить ошибки:
                  </h3>
                  <ul className="list-disc list-inside text-left max-w-md mx-auto">
                    {verificationResult.errors.map(
                      (error, index) => (
                        <li
                          key={index}
                          className="text-sm mb-1">
                          {error}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PinConnector;
