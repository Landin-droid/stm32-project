import React from "react";

const Verification = ({
  isCorrect,
  errorMessage,
  onRestart,
}) => {
  return (
    <div className="verification p-4">
      <h2 className="text-xl font-bold mb-4">
        Результат проверки:
      </h2>
      <div
        className={`w-12 h-12 rounded-full mx-auto mb-4 ${
          isCorrect ? "bg-green-500" : "bg-red-500"
        }`}></div>
      {isCorrect ? (
        <p className="text-green-600">
          Подключение верно! Симуляция готова.
        </p>
      ) : (
        <pre className="text-red-600 whitespace-pre-wrap">
          {errorMessage}
        </pre>
      )}
      <button
        onClick={onRestart}
        className="mt-4 bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
        Начать заново
      </button>
    </div>
  );
};

export default Verification;