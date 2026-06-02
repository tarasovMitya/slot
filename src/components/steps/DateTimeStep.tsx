import { useEffect } from "react";
import { useCalculatorStore } from "../../store/calculatorStore";
import { TIME_SLOTS } from "../../data/services";

function getNextDays(count: number) {
  const days = [];
  const now = new Date();
  const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const monthNames = [
    "янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек",
  ];
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    const label =
      i === 0
        ? "Сегодня"
        : i === 1
        ? "Завтра"
        : `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]}`;
    days.push({ iso, label });
  }
  return days;
}

export function DateTimeStep() {
  const { schedule, setSchedule } = useCalculatorStore();
  const days = getNextDays(10);

  // Ensure a default is always selected so the order is never saved with empty date/time
  useEffect(() => {
    const needsDate = !schedule.date;
    const needsTime = !schedule.time;
    if (needsDate || needsTime) {
      setSchedule({
        date: needsDate ? days[0].iso : schedule.date,
        time: needsTime ? TIME_SLOTS[0] : schedule.time,
      });
    }
  }, []);

  const setDate = (date: string) => setSchedule({ ...schedule, date });
  const setTime = (time: string) => setSchedule({ ...schedule, time });

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
          Когда удобно?
        </h2>
        <p className="text-gray-500 mt-2 text-lg">Выберите дату и время</p>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Дата
        </p>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {days.map(({ iso, label }) => (
            <button
              key={iso}
              onClick={() => setDate(iso)}
              className={`shrink-0 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                schedule.date === iso
                  ? "border-[#006AFF] bg-[#006AFF] text-white"
                  : "border-gray-100 text-gray-700 hover:border-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Время
        </p>
        <div className="grid grid-cols-4 gap-2">
          {TIME_SLOTS.map((slot) => (
            <button
              key={slot}
              onClick={() => setTime(slot)}
              className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                schedule.time === slot
                  ? "border-[#006AFF] bg-[#006AFF] text-white"
                  : "border-gray-100 text-gray-700 hover:border-gray-300"
              }`}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
