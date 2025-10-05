import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image, Circle, Rect, Text, Line } from 'react-konva';
import { mcuPins, mcuGroups } from '../data/sensors.jsx';

const PinConnector = ({ sensor, connections, onConnectionChange, onVerify }) => {
  const [selectedSensorPin, setSelectedSensorPin] =
    useState(null);
  const [lines, setLines] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isAllCorrect, setIsAllCorrect] = useState(false);
  const [openGroups, setOpenGroups] = useState([]); // Открытые группы
  const stageRef = useRef();
  const imageRef = useRef();

  // Функция для расчета позиции группы
  const calculateGroupPosition = (group) => {
    const baseX = 60;
    const baseY = 310;
    const groupOrder = {
      A: 0,
      B: 1,
      C: 2,
      D: 3, // Добавлена группа D
    };
    const index = groupOrder[group] || 0;
    return [baseX, baseY + index * 60]; // Увеличен шаг до 60px для предотвращения перекрытия
  };

  // Функция для расчета позиции пина MCU внутри группы
  const calculateMcuPinPosition = (mcuPin, group) => {
    const groupPosition = calculateGroupPosition(group);
    const pinsInGroup =
      mcuGroups[sensor.interfaces[0]][group];
    const pinIndex = pinsInGroup.indexOf(mcuPin);
    return [
      groupPosition[0] + 30 + pinIndex * 30,
      groupPosition[1] + 10,
    ]; // Уменьшен шаг для пинов внутри группы
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

  useEffect(() => {
    // Реальная-время проверка подключений
    let correct = true;
    let newErrors = [];
    Object.keys(sensor.correctConnections).forEach(
      (sensorPin) => {
        const requiredType =
          sensor.correctConnections[sensorPin];
        const selectedMcuPin = connections[sensorPin];
        if (!selectedMcuPin) {
          correct = false;
          newErrors.push(`Пин ${sensorPin} не подключён`);
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
          newErrors.push(
            `Пин ${sensorPin} подключён не к тому типу (${requiredType})`
          );
        }
      }
    );
    setIsAllCorrect(correct);
    setErrors(newErrors);
  }, [connections, sensor]);

  const allPinsConnected = sensor.pins.every(
    (pin) => connections[pin]
  );

  // Обработчик клика по пину датчика
  const handleSensorPinClick = (sensorPin) => {
    setSelectedSensorPin(sensorPin);
    console.log(
      "=== КЛИК ПО ДАТЧИКУ ===",
      sensorPin,
      "Состояние selectedSensorPin:",
      selectedSensorPin
    );
  };

  // Обработчик клика по пину MCU
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
      console.log("Ошибка: Нет выбранного датчика!"); // Добавь для отладки
    }
  };

  // Обработчик клика по группе
  const toggleGroup = (group) => {
    console.log(
      "Тоггл группы:",
      group,
      "Текущее openGroups:",
      openGroups
    );
    setOpenGroups((prev) => {
      if (prev.includes(group)) {
        return prev.filter((g) => g !== group);
      } else {
        return [...prev, group];
      }
    });
  };

  // Функция для расчета координат линии (если группа закрыта, линия ведёт к группе)
  const calculateLinePoints = (sensorPin, mcuPin) => {
    const sensorPosition = sensor.pinPositions[
      sensorPin
    ] || [150, 110];
    let group = mcuPin.match(/P([A-D])/)?.[1] || "A"; // Получаем группу из имени пина (например, 'PA0' -> 'A')
    console.log(
      "Расчёт линии:",
      sensorPin,
      mcuPin,
      "Группа:",
      group,
      "Открыта?",
      openGroups.includes(group)
    );

    if (mcuPin === "GND" || mcuPin === "VCC") {
      group = "D";
    }

    if (!openGroups.includes(group)) {
      // Если группа закрыта, линия ведёт к центру группы
      const groupPosition = calculateGroupPosition(group);
      const points = [
        sensorPosition[0] + 50,
        sensorPosition[1],
        groupPosition[0] + 100,
        groupPosition[1] + 20,
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
      mcuPosition[0] - 10,
      mcuPosition[1],
    ];
    console.log("Линия к пину:", points);
    return points;
  };
  // Компонент пина датчика (круг на фото)
  const SensorPin = ({ pin, position }) => {
    console.log("Рендер пина датчика:", pin, position); // Отладка
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
  // Компонент пина MCU
  const McuPin = ({ pin, position, isConnected }) =>{ 
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

  return (
    <div className="pin-connector p-4">
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
          width={600}
          height={600}
          ref={stageRef}
          className="border rounded shadow-lg">
          <Layer>
            {/* Фото датчика сверху */}
            <Image
              ref={imageRef}
              x={50}
              y={50}
              width={200}
              height={200}
              cornerRadius={5}
            />

            {/* Пины датчика (на фото, без текста) */}
            {sensor.pins.map((pin, index) => (
              <SensorPin
                key={pin}
                pin={pin}
                position={sensor.pinPositions[pin]}
              />
            ))}

            {/* Примерная схема микроконтроллера снизу */}
            <Rect
              x={50}
              y={250}
              width={300}
              height={300}
              fill="#e2e8f0"
              stroke="#1f2937"
              strokeWidth={2}
              cornerRadius={10}
            />
            <Text
              x={150}
              y={290}
              text="STM32F103"
              fontSize={14}
              align="center"
              width={200}
            />

            {/* Группы пинов */}
            {Object.keys(groups).map((group, index) => (
              <React.Fragment key={group}>
                <Rect
                  x={100}
                  y={310 + index * 60} // Увеличен шаг
                  width={200}
                  height={40}
                  fill={
                    openGroups.includes(group)
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
                      openGroups.includes(group)
                        ? "#f3f4f6"
                        : "#d1d5db"
                    );
                    stageRef.current.container().style.cursor =
                      "default";
                  }}
                />
                <Text
                  x={150}
                  y={320 + index * 60}
                  text={`Группа ${group}`}
                  fontSize={14}
                  align="center"
                  width={200}
                />
                {openGroups.includes(group) &&
                  groups[group].map((mcuPin, pinIndex) => {
                    const position = [
                      50 + 30 + pinIndex * 30,
                      310 + index * 60 + 20,
                    ];
                    const isConnected =
                      connections[
                        sensor.pins.find(
                          (p) => connections[p] === mcuPin
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
                          x={position[0] - 10}
                          y={position[1] + 15}
                          text={mcuPin}
                          fontSize={12}
                          fill="black"
                          align="center"
                        />
                      </React.Fragment>
                    );
                  })}
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

      {/* Реальная-время ошибки */}
      {errors.length > 0 && (
        <div className="mt-4 p-4 bg-red-100 rounded text-red-600">
          <h3 className="font-bold">Ошибки подключения:</h3>
          <ul>
            {errors.map((err, index) => (
              <li key={index}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-center mt-4">
        <button
          disabled={!isAllCorrect}
          onClick={onVerify}
          className={`p-2 rounded ${
            isAllCorrect
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}>
          Проверить подключение
        </button>
      </div>
    </div>
  );
};

export default PinConnector;