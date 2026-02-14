"use strict";
//alert("Привет, мир!!!");
document.getElementById("HourMoneyButton").onclick = function showValue() {
  let Oklad = document.getElementById("OkladInput").value;
  let Days = document.getElementById("DaysInput").value;
  let WorkHour = document.getElementById("WorkHourInput").value;
  let HourMoney = Oklad / Days / WorkHour;
  alert("Денег в час = " + HourMoney + " Рублей");
};
