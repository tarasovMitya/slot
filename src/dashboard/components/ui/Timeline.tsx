import { Check } from "lucide-react";
import type { TimelineEvent } from "../../types";

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  return (
    <div className="flex flex-col gap-0">
      {events.map((event, i) => {
        const isLast = i === events.length - 1;
        // "goal" = the final step that hasn't happened yet (distinct from "active")
        const isGoal = isLast && !event.completed;
        const isActive = !event.completed && !isGoal && events[i - 1]?.completed;
        // Line after this dot: gray when next step is the goal (future divider)
        const nextIsGoal = !isLast && !events[i + 1]?.completed && i === events.length - 2;

        return (
          <div key={event.id} className="flex gap-4">
            {/* Dot + connector line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  event.completed
                    ? "border-[#006AFF] bg-black"
                    : isActive
                    ? "border-[#006AFF] bg-white"
                    : isGoal
                    ? "border-gray-200 border-dashed bg-white"
                    : "border-gray-200 bg-white"
                }`}
              >
                {event.completed && <Check size={12} className="text-white" strokeWidth={3} />}
                {isActive && <div className="w-2 h-2 rounded-full bg-black animate-pulse" />}
              </div>
              {!isLast && (
                <div
                  className={`w-0.5 h-8 my-0.5 ${
                    event.completed && !nextIsGoal ? "bg-black" : "bg-gray-100"
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className="pb-6 pt-0.5 min-w-0 flex items-start gap-2 flex-1">
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    event.completed || isActive ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {event.label}
                </p>
                {event.time && (
                  <p className="text-xs text-gray-400 mt-0.5">{event.time}</p>
                )}
              </div>
              {isGoal && (
                <span className="shrink-0 text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full mt-0.5">
                  ожидается
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
