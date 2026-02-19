"use strict";

const monthNames = [
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
const STORAGE_KEY = "PayOfDeb_DB_v12";
let globalData = {};

// Праздники 2026
const specialDays2026 = {
  "0-1": "holiday",
  "0-2": "holiday",
  "0-3": "holiday",
  "0-4": "holiday",
  "0-5": "holiday",
  "0-6": "holiday",
  "0-7": "holiday",
  "0-8": "holiday",
  "0-9": "holiday",
  "1-23": "holiday",
  "2-8": "holiday",
  "2-9": "holiday",
  "3-30": "short",
  "4-1": "holiday",
  "4-8": "short",
  "4-9": "holiday",
  "4-11": "holiday",
  "5-11": "short",
  "5-12": "holiday",
  "10-3": "short",
  "10-4": "holiday",
  "11-31": "holiday",
};

function loadData() {
  const data = localStorage.getItem(STORAGE_KEY);
  globalData = data ? JSON.parse(data) : {};

  const settings = localStorage.getItem("PayOfDeb_Settings");
  if (settings) {
    const s = JSON.parse(settings);
    if (s.salary) document.getElementById("salaryInput").value = s.salary;
    if (s.stdStart) document.getElementById("settingStart").value = s.stdStart;
    if (s.stdEnd) document.getElementById("settingEnd").value = s.stdEnd;
    if (s.multiplier)
      document.getElementById("overtimeMultiplier").value = s.multiplier;
    if (s.scheduleType) {
      document.getElementById("scheduleType").value = s.scheduleType;
      toggleScheduleSettings();
    }
    if (s.cycleStart)
      document.getElementById("cycleStartDate").value = s.cycleStart;
  } else {
    toggleScheduleSettings();
  }
}

function saveSettings() {
  const settings = {
    salary: document.getElementById("salaryInput").value,
    stdStart: document.getElementById("settingStart").value,
    stdEnd: document.getElementById("settingEnd").value,
    multiplier: document.getElementById("overtimeMultiplier").value,
    scheduleType: document.getElementById("scheduleType").value,
    cycleStart: document.getElementById("cycleStartDate").value,
  };
  localStorage.setItem("PayOfDeb_Settings", JSON.stringify(settings));
  calculateStats();
}

function toggleScheduleSettings() {
  const type = document.getElementById("scheduleType").value;
  const block = document.getElementById("shiftSettings");
  block.style.display = type === "2-2" ? "block" : "none";
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(globalData));
  saveSettings();
  calculateStats();
}

function getDateKey(year, month, day) {
  return `${year}-${month}-${day}`;
}

function isWeekend(year, month, day) {
  const d = new Date(year, month, day);
  const dayOfWeek = d.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

// === ОТРИСОВКА КАЛЕНДАРЯ ===
function generateCalendar() {
  const month = parseInt(document.getElementById("monthSelect").value);
  const year = parseInt(document.getElementById("yearSelect").value);

  calculateOfficialNorm(year, month);

  const firstDay = new Date(year, month, 1).getDay();
  const firstDayRussian = firstDay === 0 ? 7 : firstDay;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const tbody = document.getElementById("days");
  tbody.innerHTML = "";

  let day = 1;
  for (let row = 0; row < 6; row++) {
    const tr = tbody.insertRow();
    for (let col = 0; col < 7; col++) {
      if ((row === 0 && col < firstDayRussian - 1) || day > daysInMonth) {
        tr.insertCell().textContent = "";
      } else {
        const cell = tr.insertCell();
        const dateKey = getDateKey(year, month, day);
        const dayData = globalData[dateKey];

        const specialKey = `${month}-${day}`;
        const status = specialDays2026[specialKey];
        const isWknd = isWeekend(year, month, day);

        if (status === "holiday") cell.classList.add("holiday");
        else if (isWknd) cell.classList.add("weekend");
        else if (status === "short") cell.classList.add("short-day");

        let html = `<span class="day-number">${day}</span>`;

        if (dayData) {
          /* --- ЗАКОММЕНТИРОВАНО (ОТПУСК) ---
                    if (dayData.isVacation) {
                        cell.classList.add("vacation-day");
                        let payIcon = dayData.isPaid ? " 💰" : "";
                        html += `<div style="font-size:0.8em; margin-top:2px; font-weight:normal;">🌴 Отпуск${payIcon}</div>`;
                        if(dayData.isPaid) {
                            html += `<span class="hours-badge" style="background:#0097a7; font-size:0.65em;">${dayData.hours} ч.</span>`;
                        }
                    } else { 
                    ------------------------------------ */
          // Обычные рабочие данные
          let cssClass = "has-data";
          let otInfo = "";
          if (dayData.overtime > 0) {
            cssClass = "has-data-weekend";
            otInfo = `<span style="color:#d32f2f; font-weight:900; margin-left:3px;">x2</span>`;
          }
          cell.classList.add(cssClass);
          html += `<span class="hours-badge">${dayData.hours} ч.${otInfo}</span>`;
          /* } // закрытие else отпуска */
        }
        cell.innerHTML = html;

        const currentDay = day;
        const isHoliday = status === "holiday";
        const isShort = status === "short";

        cell.onclick = () =>
          openModal(year, month, currentDay, isHoliday, isShort, isWknd);
        day++;
      }
    }
  }
  calculateStats();
}

function calculateOfficialNorm(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let workDays = 0;
  let reducedHours = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const isWknd = isWeekend(year, month, d);
    const specialKey = `${month}-${d}`;
    const status = specialDays2026[specialKey];
    if (!isWknd && status !== "holiday") {
      workDays++;
      if (status === "short") reducedHours++;
    }
  }
  const norm = workDays * 8 - reducedHours;
  document.getElementById("normHoursInput").value = norm;
}

// === УСТАНОВКА ОТПУСКА (ЗАКОММЕНТИРОВАНО) ===
/*
function setVacationRange() {
    const startStr = document.getElementById("vacStart").value;
    const endStr = document.getElementById("vacEnd").value;
    const isPaid = document.getElementById("vacationPaid").checked; 
    
    if (!startStr || !endStr) {
        alert("Выберите даты начала и конца отпуска!");
        return;
    }
    
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);
    
    if (endDate < startDate) {
        alert("Дата конца должна быть позже даты начала!");
        return;
    }

    let vacHours = 0;
    if (isPaid) {
        const defStart = document.getElementById("settingStart").value;
        const defEnd = document.getElementById("settingEnd").value;
        vacHours = calculateHours(defStart, defEnd, 60);
    }

    const current = new Date(startDate);
    let count = 0;
    
    while (current <= endDate) {
        const y = current.getFullYear();
        const m = current.getMonth();
        const d = current.getDate();
        const key = getDateKey(y, m, d);
        
        globalData[key] = {
            isVacation: true,
            isPaid: isPaid,
            hours: vacHours,
            overtime: 0,
            start: "", end: "", break: 0
        };
        
        current.setDate(current.getDate() + 1);
        count++;
    }
    
    saveData();
    generateCalendar();
    alert(`Отпуск установлен на ${count} дн.`);
}
*/

// === МОДАЛЬНОЕ ОКНО ===
let currentEditDate = null;

function openModal(year, month, day, isHoliday, isShort, isWknd) {
  const modal = document.getElementById("dayModal");
  currentEditDate = getDateKey(year, month, day);

  const data = globalData[currentEditDate];
  document.getElementById("modalDateTitle").textContent =
    `${day} ${monthNames[month]} ${year}`;

  // const btnRemoveVac = document.getElementById("btnRemoveVacation"); (ЗАКОММЕНТИРОВАНО)
  const workBlock = document.getElementById("workInputsBlock");
  const weekendBlock = document.getElementById("weekendBlock");
  const saveBtn = document.querySelector(".btn-save");

  /* --- ЗАКОММЕНТИРОВАНО (ОТПУСК) ---
    if (data && data.isVacation) {
        workBlock.style.display = "none";
        weekendBlock.style.display = "none";
        saveBtn.style.display = "none"; 
        // btnRemoveVac.style.display = "block";
    } else { 
    ------------------------------------ */
  // ОБЫЧНЫЙ РЕЖИМ
  saveBtn.style.display = "inline-block";
  // btnRemoveVac.style.display = "none";

  let defStart = document.getElementById("settingStart").value;
  let defEnd = document.getElementById("settingEnd").value;
  if (isShort && !data) defEnd = subtractOneHour(defEnd);

  document.getElementById("modalStart").value = data ? data.start : defStart;
  document.getElementById("modalEnd").value = data ? data.end : defEnd;
  document.getElementById("modalBreak").value = data ? data.break : 60;
  document.getElementById("modalOvertime").value = data ? data.overtime : 0;

  const checkbox = document.getElementById("isWorkedCheckbox");
  const holidayLabel = document.getElementById("holidayLabel");
  const scheduleType = document.getElementById("scheduleType").value;

  let showWeekendBlock = false;
  if (scheduleType === "2-2") {
    if (isHoliday) {
      showWeekendBlock = true;
      holidayLabel.textContent = "Смена в праздник (x2)";
    }
  } else {
    if (isWknd || isHoliday) {
      showWeekendBlock = true;
      holidayLabel.textContent = isHoliday
        ? "Работа в праздник (x2)"
        : "Работа в выходной (x2)";
    }
  }

  if (showWeekendBlock) {
    weekendBlock.style.display = "block";
    if (data) {
      checkbox.checked = true;
      workBlock.style.display = "block";
    } else {
      checkbox.checked = false;
      workBlock.style.display = "none";
    }
  } else {
    weekendBlock.style.display = "none";
    workBlock.style.display = "block";
  }

  if (!data) updateModalTotal();
  else document.getElementById("modalTotalHours").textContent = data.hours;
  /* } // закрытие else */

  modal.style.display = "block";
}

function closeModal() {
  document.getElementById("dayModal").style.display = "none";
}

/* function removeVacationFromModal() {
    deleteDayData(); 
} 
*/

function toggleWorkInputs() {
  const cb = document.getElementById("isWorkedCheckbox");
  document.getElementById("workInputsBlock").style.display = cb.checked
    ? "block"
    : "none";
  if (cb.checked) updateModalTotal();
}

function subtractOneHour(timeStr) {
  if (!timeStr) return "17:00";
  let [h, m] = timeStr.split(":").map(Number);
  h = h - 1;
  if (h < 0) h = 23;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

document
  .getElementById("modalStart")
  .addEventListener("change", updateModalTotal);
document
  .getElementById("modalEnd")
  .addEventListener("change", updateModalTotal);
document
  .getElementById("modalBreak")
  .addEventListener("input", updateModalTotal);

function updateModalTotal() {
  const startStr = document.getElementById("modalStart").value;
  const endStr = document.getElementById("modalEnd").value;
  const breakMin = parseInt(document.getElementById("modalBreak").value) || 0;

  if (!startStr || !endStr) return;

  const s = new Date(`1970-01-01T${startStr}Z`);
  const e = new Date(`1970-01-01T${endStr}Z`);
  let diffMs = e - s;
  if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;

  let totalMins = diffMs / 1000 / 60 - breakMin;
  if (totalMins < 0) totalMins = 0;
  const totalHours = parseFloat((totalMins / 60).toFixed(2));

  document.getElementById("modalTotalHours").textContent = totalHours;

  let overtimeHours = 0;
  const scheduleType = document.getElementById("scheduleType").value;
  const checkbox = document.getElementById("isWorkedCheckbox");
  const weekendBlock = document.getElementById("weekendBlock");

  if (weekendBlock.style.display !== "none" && checkbox.checked) {
    overtimeHours = totalHours;
  } else {
    if (scheduleType === "5-2") {
      overtimeHours = calculateDailyOvertime(startStr, endStr, totalMins);
    }
  }
  document.getElementById("modalOvertime").value = overtimeHours;
}

function calculateDailyOvertime(workStartStr, workEndStr, totalWorkMins) {
  const stdStartStr = document.getElementById("settingStart").value;
  const stdEndStr = document.getElementById("settingEnd").value;
  const ws = parseTime(workStartStr);
  let we = parseTime(workEndStr);
  const ss = parseTime(stdStartStr);
  const se = parseTime(stdEndStr);
  if (we < ws) we += 24 * 60;

  let before = ws < ss ? ss - ws : 0;
  let after = we > se ? we - se : 0;
  let ovMins = before + after;
  if (ovMins > totalWorkMins) ovMins = totalWorkMins;

  return parseFloat((ovMins / 60).toFixed(2));
}

function parseTime(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function saveDayData() {
  const start = document.getElementById("modalStart").value;
  const end = document.getElementById("modalEnd").value;
  const breakMin = parseInt(document.getElementById("modalBreak").value) || 0;
  const totalHours = parseFloat(
    document.getElementById("modalTotalHours").textContent,
  );
  const overtime =
    parseFloat(document.getElementById("modalOvertime").value) || 0;

  const weekendBlock = document.getElementById("weekendBlock");
  const checkbox = document.getElementById("isWorkedCheckbox");

  if (weekendBlock.style.display !== "none" && !checkbox.checked) {
    deleteDayData();
    return;
  }
  if (!start || !end) {
    alert("Заполните время!");
    return;
  }

  globalData[currentEditDate] = {
    start,
    end,
    break: breakMin,
    hours: totalHours,
    overtime,
    isVacation: false,
  };
  saveData();
  closeModal();
  generateCalendar();
}

function deleteDayData() {
  if (globalData[currentEditDate]) {
    delete globalData[currentEditDate];
    saveData();
  }
  closeModal();
  generateCalendar();
}

function fillMonth() {
  const type = document.getElementById("scheduleType").value;

  if (isMonthHasData()) {
    // if (!confirm("Заполнить график в пустых ячейках и обновить рабочие дни?")) return; // (Убрана логика отпуска)
    if (!confirm("Месяц не пуст. Перезаписать данные новым графиком?")) return;
    // clearScheduleOnly(); // ЗАКОММЕНТИРОВАНО (было нужно для отпуска)
    clearMonthInternal(); // Возвращаем полную очистку, так как отпуска нет
  }
  if (type === "5-2") fillStandard52();
  else fillShift22();
}

function isMonthHasData() {
  const month = parseInt(document.getElementById("monthSelect").value);
  const year = parseInt(document.getElementById("yearSelect").value);
  for (let key in globalData) {
    const [kYear, kMonth] = key.split("-").map(Number);
    if (kYear === year && kMonth === month) return true;
  }
  return false;
}

/* ЗАКОММЕНТИРОВАНО (ОТПУСК)
function clearScheduleOnly() {
    const month = parseInt(document.getElementById("monthSelect").value);
    const year = parseInt(document.getElementById("yearSelect").value);
    for (let key in globalData) {
        const [kYear, kMonth] = key.split('-').map(Number);
        if (kYear === year && kMonth === month) {
            if (!globalData[key].isVacation) {
                delete globalData[key];
            }
        }
    }
}
*/

function clearAllData() {
  const month = parseInt(document.getElementById("monthSelect").value);
  const year = parseInt(document.getElementById("yearSelect").value);
  for (let key in globalData) {
    const [kYear, kMonth] = key.split("-").map(Number);
    if (kYear === year && kMonth === month) delete globalData[key];
  }
}

function clearMonthData() {
  if (!confirm("Удалить ВСЕ данные за этот месяц?")) return;
  clearAllData();
  saveData();
  generateCalendar();
}

// ВНУТРЕННЯЯ ОЧИСТКА
function clearMonthInternal() {
  clearAllData();
}

function fillStandard52() {
  const month = parseInt(document.getElementById("monthSelect").value);
  const year = parseInt(document.getElementById("yearSelect").value);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const defStart = document.getElementById("settingStart").value;
  const defEnd = document.getElementById("settingEnd").value;
  const defEndShort = subtractOneHour(defEnd);
  let added = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = getDateKey(year, month, d);
    const isWknd = isWeekend(year, month, d);
    const specialKey = `${month}-${d}`;
    const status = specialDays2026[specialKey];

    if (!isWknd && status !== "holiday" && !globalData[dateKey]) {
      const currentEnd = status === "short" ? defEndShort : defEnd;
      const h = calculateHours(defStart, currentEnd, 60);

      globalData[dateKey] = {
        start: defStart,
        end: currentEnd,
        break: 60,
        hours: h,
        overtime: 0,
        isVacation: false,
      };
      added++;
    }
  }
  afterFill(added);
}

function fillShift22() {
  const startStr = document.getElementById("cycleStartDate").value;
  if (!startStr) {
    alert("Выберите дату первой смены!");
    return;
  }
  const month = parseInt(document.getElementById("monthSelect").value);
  const year = parseInt(document.getElementById("yearSelect").value);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const parts = startStr.split("-");
  const cycleStart = new Date(parts[0], parts[1] - 1, parts[2]);
  const defStart = document.getElementById("settingStart").value;
  const defEnd = document.getElementById("settingEnd").value;
  const shiftHours = calculateHours(defStart, defEnd, 60);

  let added = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = getDateKey(year, month, d);

    // if (globalData[dateKey]) continue; // (Можно разкомментировать, если хотите сохранять ручной ввод)

    const currentDate = new Date(year, month, d);
    const utc1 = Date.UTC(
      cycleStart.getFullYear(),
      cycleStart.getMonth(),
      cycleStart.getDate(),
    );
    const utc2 = Date.UTC(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
    );
    const diffDays = Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
    const cycleDay = ((diffDays % 4) + 4) % 4;

    if (cycleDay < 2) {
      const specialKey = `${month}-${d}`;
      const isHoliday = specialDays2026[specialKey] === "holiday";
      const ov = isHoliday ? shiftHours : 0;

      globalData[dateKey] = {
        start: defStart,
        end: defEnd,
        break: 60,
        hours: shiftHours,
        overtime: ov,
        isVacation: false,
      };
      added++;
    }
  }
  afterFill(added);
}

function calculateHours(start, end, br) {
  const s = new Date(`1970-01-01T${start}Z`);
  const e = new Date(`1970-01-01T${end}Z`);
  let h = ((e - s) / 1000 / 60 - br) / 60;
  return parseFloat(h.toFixed(2));
}

function afterFill(count) {
  saveData();
  generateCalendar();
}

function calculateStats() {
  const salary = parseFloat(document.getElementById("salaryInput").value) || 0;
  const normHours =
    parseFloat(document.getElementById("normHoursInput").value) || 164;
  const multiplier =
    parseFloat(document.getElementById("overtimeMultiplier").value) || 2;

  const hourRate = normHours > 0 ? salary / normHours : 0;
  document.getElementById("hourRate").textContent = hourRate.toFixed(2);

  const month = parseInt(document.getElementById("monthSelect").value);
  const year = parseInt(document.getElementById("yearSelect").value);

  let totalHours = 0;
  let totalOvertime = 0;
  let totalMoney = 0;

  for (let key in globalData) {
    const [kYear, kMonth] = key.split("-").map(Number);
    if (kYear === year && kMonth === month) {
      const day = globalData[key];

      /* --- ЗАКОММЕНТИРОВАНО (ОТПУСК) ---
            if (day.isVacation) {
                if (day.isPaid) {
                    totalHours += day.hours;
                    totalMoney += day.hours * hourRate;
                }
                continue; 
            }
            ------------------------------------ */

      // Обычные дни
      const h = day.hours;
      const ov = day.overtime || 0;
      const normal = h - ov;
      const money = normal * hourRate + ov * hourRate * multiplier;

      totalHours += h;
      totalOvertime += ov;
      totalMoney += money;
    }
  }

  document.getElementById("totalHoursMonth").textContent =
    totalHours.toFixed(2);
  document.getElementById("totalOvertimeMonth").textContent =
    totalOvertime.toFixed(2);
  document.getElementById("totalMoneyMonth").textContent =
    Math.round(totalMoney);
}

document.addEventListener("DOMContentLoaded", function () {
  loadData();
  const yearSelect = document.getElementById("yearSelect");
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 2; y <= currentYear + 2; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if (y === currentYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }
  document.getElementById("monthSelect").value = new Date().getMonth();

  document
    .getElementById("monthSelect")
    .addEventListener("change", generateCalendar);
  document
    .getElementById("yearSelect")
    .addEventListener("change", generateCalendar);
  document.getElementById("salaryInput").addEventListener("input", () => {
    saveData();
  });

  window.onclick = function (event) {
    if (event.target == document.getElementById("dayModal")) closeModal();
  };
  generateCalendar();
});
