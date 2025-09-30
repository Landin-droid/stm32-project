export const sensors = [
  {
    name: "TMP36",
    interfaces: ["Analog"],
    pins: ["GND", "Vout", "Vdd"],
    image: "/assets/sensors/TMP36.jpg",
    imageTopView: "/assets/sensors/TMP36_Pins.jpg",
    pinPositions: {
      GND: [80, 290],
      Vout: [100, 290],
      Vdd: [120, 290],
    },
    correctConnections: {
      GND: "GND",
      Vout: "ADC",
      Vdd: "VCC",
    },
  },
  {
    name: "DS18B20",
    interfaces: ["1-Wire"],
    pins: ["GND", "DQ", "Vdd"],
    image: "/assets/sensors/DS18B20.webp",
    imageTopView: "/assets/sensors/DS18B20_Pins.jpg",
    pinPositions: {
      GND: [75, 300],
      DQ: [97, 300],
      Vdd: [119, 300],
    },
    correctConnections: {
      GND: "GND",
      DQ: "GPIO",
      Vdd: "VCC",
    },
  },
  {
    name: "LM75A",
    interfaces: ["I2C"],
    pins: ["GND", "SDA", "SCL", "Vdd"],
    image: "/assets/sensors/LM75A.webp",
    imageTopView: "/assets/sensors/LM75A_Pins.jpg",
    pinPositions: {
      Vdd: [33, 148],
      GND: [26, 165],
      SDA: [20, 180],
      SCL: [10, 195],
    },
    correctConnections: {
      GND: "GND",
      SDA: "I2C_SDA",
      SCL: "I2C_SCL",
      Vdd: "VCC",
    },
  },
];

export const mcuPins = {
  GND: { name: "GND", functions: ["GND"] },
  VCC: { name: "VCC", functions: ["VCC"] },
  PA0: { name: "PA0", functions: ["GPIO", "ADC"] },
  PA1: { name: "PA1", functions: ["GPIO", "ADC"] },
  PA2: { name: "PA2", functions: ["GPIO", "ADC"] },
  PA3: { name: "PA3", functions: ["GPIO", "ADC"] },
  PA4: { name: "PA4", functions: ["GPIO"] },
  PB0: { name: "PB0", functions: ["GPIO"] },
  PB1: { name: "PB1", functions: ["GPIO"] },
  PB6: { name: "PB6", functions: ["I2C_SCL"] },
  PB7: { name: "PB7", functions: ["I2C_SDA"] },
  PB8: { name: "PB8", functions: ["I2C_SCL"] },
  PB9: { name: "PB9", functions: ["I2C_SDA"] },
};
