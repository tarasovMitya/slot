import { useEffect } from "react";
import { Loader2, CheckCircle, Circle, ArrowUp, ArrowDown } from "lucide-react";
import { useAffiliateStore } from "../store/affiliateStore";
import { PRIORITY_LABELS, PRIORITY_COLORS } from "../types";

const PRIORITY_ICON: Record<string, React.ReactNode> = {
  high:   <ArrowUp size={13} className="text-red-500" />,
  normal: <ArrowDown size={13} className="text-yellow-500 rotate-45" />,
  low:    <ArrowDown size={13} className="text-[#6b7194]" />,
};

export function AffiliateTasksPage() {
  const { tasks, isLoadingTasks, loadTasks, markTaskDone, unmarkTask } = useAffiliateStore();

  useEffect(() => { loadTasks(); }, []);

  const pending = tasks.filter((t) => !t.completedAt);
  const done    = tasks.filter((t) => !!t.completedAt);

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Задачник</h1>
        <p className="text-sm text-[#6b7194] mt-0.5">Задачи от администратора</p>
      </div>

      {isLoadingTasks ? (
        <div className="flex justify-center pt-10"><Loader2 className="animate-spin text-[#006AFF]" /></div>
      ) : tasks.length === 0 ? (
        <div className="bg-[#0f1120] rounded-xl border border-white/[0.06] p-10 text-center">
          <p className="text-[#6b7194] text-sm">Задач пока нет</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="flex flex-col gap-3 mb-6">
              {pending.map((task) => (
                <div key={task.id} className="bg-[#0f1120] rounded-xl border border-white/[0.06] p-5">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => markTaskDone(task.id)}
                      className="mt-0.5 shrink-0 text-gray-300 hover:text-[#006AFF] transition-colors"
                    >
                      <Circle size={20} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {PRIORITY_ICON[task.priority]}
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority] ?? ""}`}>
                          {PRIORITY_LABELS[task.priority] ?? task.priority}
                        </span>
                        {task.dueDate && (
                          <span className="text-xs text-[#6b7194] ml-auto">
                            до {new Date(task.dueDate).toLocaleDateString("ru-RU")}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-white">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-[#6b7194] mt-1 whitespace-pre-line">{task.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {done.length > 0 && (
            <>
              <p className="text-xs font-semibold text-[#6b7194] uppercase tracking-wide mb-3">Выполнено ({done.length})</p>
              <div className="flex flex-col gap-3">
                {done.map((task) => (
                  <div key={task.id} className="bg-gray-50 rounded-2xl border border-gray-100 p-5 opacity-60">
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => unmarkTask(task.id)}
                        className="mt-0.5 shrink-0 text-green-500"
                      >
                        <CheckCircle size={20} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#a0a5c0] line-through">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-[#6b7194] mt-1 whitespace-pre-line">{task.description}</p>
                        )}
                        {task.completedAt && (
                          <p className="text-xs text-[#6b7194] mt-1">
                            Выполнено: {new Date(task.completedAt).toLocaleDateString("ru-RU")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
