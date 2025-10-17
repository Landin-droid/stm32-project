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
import { mcuPins, mcuGroups, groupLayouts } from "../data/sensors.jsx";

// Компонент аккордеона для сворачиваемых блоков
const Accordion = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-4 bg-white rounded-lg overflow-hidden">
      <button
        className="w-full px-4 py-3 text-left bg-gray-200 hover:bg-gray-300 transition-colors duration-200 flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold text-gray-800">{title}</span>
        <svg
          className={`w-5 h-5 transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="#000"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
};

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
  const [openGroup, setOpenGroup] = useState(null);
  const [notification, setNotification] = useState(null);
  const stageRef = useRef();
  const imageRef = useRef();

  // Функция для показа уведомлений
  const showNotification = (message, type = "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Функция для проверки правильности подключения одного пина
  const isPinCorrectlyConnected = (sensorPin, mcuPin) => {
    if (!mcuPin) return false;

    const requiredType =
      sensor.correctConnections[sensorPin];
    const mcuPinConfig = Object.values(mcuPins).find(
      (pin) => pin.name === mcuPin
    );

    return (
      mcuPinConfig &&
      mcuPinConfig.functions.includes(requiredType)
    );
  };

  // Функция для получения статуса подключения пина датчика
  const getPinConnectionStatus = (sensorPin) => {
    const mcuPin = connections[sensorPin];
    if (!mcuPin) return "not-connected";

    return isPinCorrectlyConnected(sensorPin, mcuPin)
      ? "correct"
      : "incorrect";
  };

  // Функция для подсчета КОРРЕКТНО подключенных пинов
  const getCorrectlyConnectedPinsCount = () => {
    return Object.entries(connections).filter(
      ([sensorPin, mcuPin]) =>
        mcuPin && isPinCorrectlyConnected(sensorPin, mcuPin)
    ).length;
  };

  const getActiveGroups = () => {
    const interfaceType = sensor.interfaces[0];
    const groups = mcuGroups[interfaceType] || {};
    const layout =
      groupLayouts[sensor.layout] || groupLayouts.default;
    const activeGroups = {};

    Object.keys(layout).forEach((group) => {
      if (groups[group] && groups[group].length > 0) {
        activeGroups[group] = {
          pins: groups[group],
          position: layout[group],
        };
      }
    });

    return activeGroups;
  };

  // Функция для расчета позиции пина MCU внутри группы
  const calculateMcuPinPosition = (
    mcuPin,
    group,
    groupData
  ) => {
    const groupPosition = groupData.position;
    const pinsInGroup = groupData.pins;
    const pinIndex = pinsInGroup.indexOf(mcuPin);

    return [
      groupPosition.x +
        groupData.position.pinStart +
        pinIndex * 35,
      groupPosition.y + 60,
    ];
  };

  const calculateLinePoints = (sensorPin, mcuPin) => {
    const sensorPosition = sensor.pinPositions[
      sensorPin
    ] || [150, 110];
    let group = mcuPin.match(/P([A-D])/)?.[1] || "A";

    if (mcuPin === "GND" || mcuPin === "VCC") {
      group = "D";
    }

    const activeGroups = getActiveGroups();
    const groupData = activeGroups[group];

    if (!groupData) {
      return [
        sensorPosition[0] + 50,
        sensorPosition[1],
        400,
        340,
      ];
    }

    if (openGroup !== group) {
      // Если группа закрыта, линия ведёт к центру группы
      const groupPosition = groupData.position;
      const points = [
        sensorPosition[0] + 50,
        sensorPosition[1],
        groupPosition.x + 90,
        groupPosition.y + 20,
      ];
      console.log("Линия к группе:", points);
      return points;
    }

    // Если группа открыта, линия ведёт к пину
    const mcuPosition = calculateMcuPinPosition(
      mcuPin,
      group,
      groupData
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

    const allPinsConnected = sensor.pins.every(
      (pin) => connections[pin]
    );
    if (!allPinsConnected) {
      isCorrect = false;
      errors.push("Не все пины датчика подключены");
    }

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
            `Пин ${sensorPin} должен быть подключен к пину с функцией ${requiredType},
            но подключён к пину ${selectedMcuPin} с другой функцией`
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
    showNotification(
      `Выбран пин датчика: ${sensorPin}`,
      "info"
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
      // Проверяем, не подключен ли уже этот пин МК к другому датчику
      const connectedSensorPin = Object.keys(
        connections
      ).find(
        (pin) =>
          connections[pin] === mcuPin &&
          pin !== selectedSensorPin
      );

      if (connectedSensorPin) {
        showNotification(
          `Пин ${mcuPin} уже подключен к пину датчика "${connectedSensorPin}". Сначала отключите предыдущее соединение.`,
          "error"
        );
        setSelectedSensorPin(null);
        return;
      }

      const currentConnection =
        connections[selectedSensorPin];
      if (currentConnection) {
        showNotification(
          `Пин ${selectedSensorPin} переподключен с ${currentConnection} на ${mcuPin}`,
          "warning"
        );
      } else {
        showNotification(
          `Пин ${selectedSensorPin} подключен к ${mcuPin}`,
          "info"
        );
      }
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
      showNotification(
        "Сначала выберите пин датчика!",
        "error"
      );
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
        return null;
      } else {
        return group;
      }
    });
  };

  const SensorPin = ({
    pin,
    position,
    connectionStatus,
  }) => {
    console.log("Рендер пина датчика:", pin, position);
    if (!position) {
      console.error(`Позиция для пина ${pin} не найдена`);
      position = [150, 110];
    }

    // Определяем цвет в зависимости от статуса подключения
    const getPinColor = () => {
      switch (connectionStatus) {
        case "correct":
          return { fill: "#10b981", stroke: "#059669" };
        case "incorrect":
          return { fill: "#ef4444", stroke: "#dc2626" };
        case "selected":
          return { fill: "#3b82f6", stroke: "#1d4ed8" };
        default:
          return { fill: "transparent", stroke: "#10b981" };
      }
    };

    const colors = getPinColor();

    return (
      <Circle
        x={position[0] + 50}
        y={position[1]}
        radius={8}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={2}
        onClick={() => handleSensorPinClick(pin)}
        onMouseEnter={(e) => {
          if (connectionStatus !== "selected") {
            e.target.scale({ x: 1.2, y: 1.2 });
          }
          stageRef.current.container().style.cursor =
            "pointer";
        }}
        onMouseLeave={(e) => {
          if (connectionStatus !== "selected") {
            e.target.scale({ x: 1, y: 1 });
          }
          stageRef.current.container().style.cursor =
            "default";
        }}
      />
    );
  };

  const McuPin = ({
    pin,
    position,
    isConnected,
    connectionStatus,
  }) => {
    console.log("Рендер пина MCU:", pin, position);
    const isOccupied =
      Object.values(connections).includes(pin) &&
      !isConnected;

    // Определяем цвет в зависимости от статуса подключения
    const getPinColor = () => {
      if (isOccupied) {
        return { fill: "#ef4444", stroke: "#dc2626" }; // Занят другим датчиком
      }

      switch (connectionStatus) {
        case "correct":
          return { fill: "#10b981", stroke: "#059669" };
        case "incorrect":
          return { fill: "#ef4444", stroke: "#dc2626" };
        default:
          return { fill: "transparent", stroke: "#3b82f6" };
      }
    };

    const colors = getPinColor();

    return (
      <Circle
        x={position[0]}
        y={position[1]}
        radius={8}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={2}
        onClick={() => handleMcuPinClick(pin)}
        onMouseEnter={(e) => {
          e.target.scale({ x: 1.2, y: 1.2 });
          stageRef.current.container().style.cursor =
            isOccupied ? "not-allowed" : "pointer";
        }}
        onMouseLeave={(e) => {
          e.target.scale({ x: 1, y: 1 });
          stageRef.current.container().style.cursor =
            "default";
        }}
      />
    );
  };

  const activeGroups = getActiveGroups();
  const totalPinsCount = sensor.pins.length;

  // НОВЫЕ ПЕРЕМЕННЫЕ ДЛЯ СТАТУСА ПОДКЛЮЧЕНИЯ
  const correctlyConnectedCount =
    getCorrectlyConnectedPinsCount();
  const incorrectlyConnectedCount =
    Object.keys(connections).filter(
      (pin) => connections[pin]
    ).length - correctlyConnectedCount;
  const notConnectedCount =
    totalPinsCount -
    (correctlyConnectedCount + incorrectlyConnectedCount);

  // const connectedPinsCount = Object.keys(
  //   connections
  // ).filter((pin) => connections[pin]).length;

  return (
    <div className="pin-connector p-4">
      {/* Уведомления */}
      {notification && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-md transform transition-all duration-300 ${
            notification.type === "error"
              ? "bg-red-100 border border-red-400 text-red-700"
              : notification.type === "success"
              ? "bg-green-100 border border-green-400 text-green-700"
              : notification.type === "warning"
              ? "bg-yellow-100 border border-yellow-400 text-yellow-700"
              : "bg-blue-100 border border-blue-400 text-blue-700"
          }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {notification.type === "error" && (
                <svg
                  className="w-5 h-5 mt-0.5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {notification.type === "success" && (
                <svg
                  className="w-5 h-5 mt-0.5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {notification.type === "warning" && (
                <svg
                  className="w-5 h-5 mt-0.5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {notification.type === "info" && (
                <svg
                  className="w-5 h-5 mt-0.5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-row justify-between">
        <div className="flex">
          <Stage
            width={800}
            height={550}
            ref={stageRef}
            className="border rounded shadow-lg">
            <Layer>
              {/* Фото датчика сверху */}
              <Image
                ref={imageRef}
                x={275}
                y={20}
                width={250}
                height={220}
                cornerRadius={5}
              />

              {/* Пины датчика с цветовой индикацией */}
              {sensor.pins.map((pin, index) => (
                <SensorPin
                  key={pin}
                  pin={pin}
                  position={sensor.pinPositions[pin]}
                  connectionStatus={
                    selectedSensorPin === pin
                      ? "selected"
                      : getPinConnectionStatus(pin)
                  }
                />
              ))}

              {/* Контейнер микроконтроллера */}
              <Rect
                x={100}
                y={250}
                width={600}
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

              {/* Рендерим все активные группы динамически */}
              {Object.entries(activeGroups).map(
                ([group, groupData]) => (
                  <React.Fragment key={group}>
                    <Rect
                      x={groupData.position.x}
                      y={groupData.position.y}
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
                      x={groupData.position.x + 50}
                      y={groupData.position.y + 10}
                      text={`${
                        group === "D"
                          ? "Others"
                          : `Группа ${group}`
                      }`}
                      fontSize={14}
                      align="center"
                      width={100}
                      listening={false}
                    />

                    {/* Пины группы с цветовой индикацией */}
                    {openGroup === group && (
                      <React.Fragment>
                        {groupData.pins.map(
                          (mcuPin, pinIndex) => {
                            const position =
                              calculateMcuPinPosition(
                                mcuPin,
                                group,
                                groupData
                              );
                            const connectedSensorPin =
                              sensor.pins.find(
                                (p) =>
                                  connections[p] === mcuPin
                              );
                            const isConnected =
                              !!connectedSensorPin;

                            return (
                              <React.Fragment key={mcuPin}>
                                <McuPin
                                  pin={mcuPin}
                                  position={position}
                                  isConnected={isConnected}
                                  connectionStatus={
                                    connectedSensorPin
                                      ? isPinCorrectlyConnected(
                                          connectedSensorPin,
                                          mcuPin
                                        )
                                        ? "correct"
                                        : "incorrect"
                                      : "not-connected"
                                  }
                                />
                                <Text
                                  x={position[0] - 15}
                                  y={position[1] + 15}
                                  text={mcuPin}
                                  fontSize={12}
                                  fill="black"
                                  align="center"
                                  width={31}
                                />
                              </React.Fragment>
                            );
                          }
                        )}
                      </React.Fragment>
                    )}
                  </React.Fragment>
                )
              )}

              {/* Линии соединений с цветовой индикацией */}
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
                  const isCorrect = isPinCorrectlyConnected(
                    sensorPin,
                    mcuPin
                  );
                  return (
                    <Line
                      key={`${sensorPin}-${mcuPin}`}
                      points={points}
                      stroke={
                        isCorrect ? "#10b981" : "#ef4444"
                      }
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

        <div className="flex flex-col w-150">
          {/* Блок информации о датчике */}
          <Accordion
            title={`Датчик: ${sensor.name}`}
            defaultOpen={true}>
            <div className="space-y-2 text-black">
              <p className="text-sm">
                <span className="font-semibold">
                  Интерфейс:
                </span>{" "}
                {sensor.interfaces.join(", ")}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Пины:</span>{" "}
                {sensor.pins.join(", ")}
              </p>
              <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                <p className="text-xs font-semibold text-blue-800 mb-1">
                  Текущий выбор пина:
                </p>
                <p className="text-sm">
                  {selectedSensorPin
                    ? `Выбран пин: ${selectedSensorPin}`
                    : "Пин датчика не выбран"}
                </p>
              </div>
            </div>
          </Accordion>

          {/* Блок инструкции */}
          <Accordion
            title="Как подключить"
            defaultOpen={true}>
            <ol className="text-black font-semibold list-decimal list-inside text-sm space-y-1">
              <li>Нажмите на зелёный круг (пин датчика)</li>
              <li>
                Нажмите на синий круг в одной из групп (пин
                STM32F103)
              </li>
              <li className="text-red-600">
                Красные круги - уже занятые пины
              </li>
              <li className="text-green-600">
                Зелёные линии - правильные подключения
              </li>
              <li className="text-red-600">
                Красные линии - неправильные подключения
              </li>
              <li>Повторите для всех пинов датчика</li>
              <li>
                При возникновении трудностей обратитесь к
                таблице 5&nbsp;
                <a
                  className="underline text-blue-600"
                  href="https://www.st.com/resource/en/datasheet/stm32f103c8.pdf">
                  документации
                </a>
              </li>
            </ol>
          </Accordion>

          {/* Блок статуса подключения */}
          <Accordion
            title="Статус подключения"
            defaultOpen={true}>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-xs text-center text-black">
                <div className="bg-green-100 p-2 rounded border border-green-300">
                  <div className="font-semibold text-green-800">
                    Правильно
                  </div>
                  <div className="text-lg font-bold">
                    {correctlyConnectedCount}
                  </div>
                </div>
                <div className="bg-red-100 p-2 rounded border border-red-300">
                  <div className="font-semibold text-red-800">
                    Неправильно
                  </div>
                  <div className="text-lg font-bold">
                    {incorrectlyConnectedCount}
                  </div>
                </div>
                <div className="bg-gray-100 p-2 rounded border border-gray-300">
                  <div className="font-semibold text-gray-800">
                    Не подключено
                  </div>
                  <div className="text-lg font-bold">
                    {notConnectedCount}
                  </div>
                </div>
              </div>

              {/* Многоуровневая полоса прогресса */}
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-green-500 h-4 float-left transition-all duration-300"
                  style={{
                    width: `${
                      (correctlyConnectedCount /
                        totalPinsCount) *
                      100
                    }%`,
                  }}
                  title={`Правильно подключено: ${correctlyConnectedCount}`}></div>
                <div
                  className="bg-red-500 h-4 float-left transition-all duration-300"
                  style={{
                    width: `${
                      (incorrectlyConnectedCount /
                        totalPinsCount) *
                      100
                    }%`,
                  }}
                  title={`Неправильно подключено: ${incorrectlyConnectedCount}`}></div>
              </div>

              <p className="text-sm text-center text-gray-900">
                Прогресс: {correctlyConnectedCount} из{" "}
                {totalPinsCount} пинов правильно
              </p>
            </div>
          </Accordion>

          {/* Блок проверки подключения */}
          {verificationResult && (
            <Accordion
              title={
                verificationResult.isCorrect
                  ? "Проверка пройдена"
                  : "Требуются исправления"
              }
              defaultOpen={true}>
              <div
                className={
                  verificationResult.isCorrect
                    ? "bg-green-50 border border-green-200 rounded p-3"
                    : "bg-red-50 border border-red-200 rounded p-3"
                }>
                {verificationResult.isCorrect ? (
                  <div className="text-center">
                    <p className="font-semibold text-green-800 mb-2 text-base">
                      Всё подключено правильно! 🎉
                    </p>
                    <p className="text-sm text-green-700">
                      Все пины датчика подключены к
                      правильным выводам STM32
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-red-800 mb-2">
                      Обнаружены ошибки подключения:
                    </p>
                    <ul className="list-disc list-inside text-base text-red-700 space-y-1">
                      {verificationResult.errors.map(
                        (error, index) => (
                          <li key={index}>{error}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </Accordion>
          )}
        </div>
      </div>
    </div>
  );
};

export default PinConnector;