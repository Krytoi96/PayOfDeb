"use strict";

const monthNames = [
  // Массив названий месяцев для будущего использования
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

function generateCalendar() {
  // Получаем выбранный месяц (0-11) из селекта
  const month = parseInt(document.getElementById("monthSelect").value);
  // Получаем выбранный год из селекта
  const year = parseInt(document.getElementById("yearSelect").value);
  document.querySelector(".calendar h3").textContent =
    `${monthNames[month]} ${year}`;
  // Точный расчет для России (неделя: Пн-Вс)
  const firstDay = new Date(year, month, 1).getDay();
  const firstDayRussian = firstDay === 0 ? 7 : firstDay; // 0-7 для воскресенья

  // Количество дней в выбранном месяце
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Находим tbody таблицы календаря
  const tbody = document.getElementById("days");
  tbody.innerHTML = ""; // Очищаем предыдущий календарь

  let day = 1; // Счетчик текущего дня месяца

  // Создаем 6 строк таблицы (максимум для любого месяца)
  for (let row = 0; row < 6; row++) {
    const tr = tbody.insertRow(); // Создаем новую строку

    // Создаем 7 столбцов (дни недели)
    for (let col = 0; col < 7; col++) {
      // Пустые ячейки: до начала месяца ИЛИ после окончания
      if ((row === 0 && col < firstDayRussian - 1) || day > daysInMonth) {
        tr.insertCell().textContent = ""; // Пустая ячейка
      } else {
        // День месяца - заполняем
        const cell = tr.insertCell();
        cell.textContent = day;

        // === ВЫДЕЛЕНИЕ ВЫХОДНЫХ И ПРАЗДНИКОВ ===
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();

        // Выходные
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          cell.classList.add("weekend");
        }

        // Короткие дни (ПЕРЕД праздниками, только рабочие)
        const shortDays = {
          0: [11], // 31 декабря НЕТ (выходной)
          1: [22], // 22 февраля перед 23
          2: [7], // 7 марта перед 8 марта
          3: [30], // 30 апреля перед 1 мая
          4: [8], // 8 мая перед 9 мая
          5: [11], // 11 июня перед 12 июня
          10: [3], // 3 ноября перед 4 ноября
          11: [30], // 30 декабря перед 31 декабря
        };

        if (
          shortDays[month] &&
          shortDays[month].includes(day) &&
          dayOfWeek !== 0 &&
          dayOfWeek !== 6
        ) {
          cell.classList.add("short-day");
        }

        // Праздники (отдельно)
        const holidays = {
          0: [1, 2, 3, 4, 5, 6, 7, 8, 9],
          1: [23],
          2: [8],
          4: [1, 9],
          5: [12],
          10: [4],
          11: [31],
        };

        if (holidays[month] && holidays[month].includes(day)) {
          cell.classList.add("holiday");
        }

        // // === ГРАФИК РАБОТЫ ===
        // const schedule = document.getElementById("scheduleSelect").value;
        // const startDayNum = parseInt(document.getElementById("startDay").value);

        // if (schedule !== "none") {
        //   const isWorkingDay =
        //     !cell.classList.contains("weekend") &&
        //     !cell.classList.contains("holiday") &&
        //     !cell.classList.contains("short-day");

        //   if (schedule === "5/2") {
        //     // 5/2: голубой ТОЛЬКО рабочие дни (НЕ короткие)
        //     if (isWorkingDay && (day - startDayNum) % 7 < 5) {
        //       cell.classList.add("workday-5-2");
        //     }
        //   } else if (schedule === "2/2") {
        //     // 2/2: голубой ВСЕ дни по циклу 2 через 2
        //     if ((day - startDayNum) % 4 < 2) {
        //       cell.classList.add("workday-2-2");
        //     }
        //   }
        // }

        day++;
      }
    }
  }
}

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", function () {
  generateCalendar(); // Рисуем календарь при загрузке
});

// Обработчик смены месяца - перерисовываем календарь
document
  .getElementById("monthSelect")
  .addEventListener("change", generateCalendar);

// Обработчик смены года - перерисовываем календарь
document
  .getElementById("yearSelect")
  .addEventListener("change", generateCalendar);

// Добавьте в конец файла
// document
//   .getElementById("scheduleSelect")
//   .addEventListener("change", generateCalendar);
// document
//   .getElementById("startDay")
//   .addEventListener("change", generateCalendar);
