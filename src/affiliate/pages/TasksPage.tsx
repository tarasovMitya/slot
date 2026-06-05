import { useEffect, useState } from "react";
import { Loader2, ArrowUp, Minus, ArrowDown, X, Check, Plus, Search } from "lucide-react";
import { useAffiliateStore } from "../store/affiliateStore";
import { affiliateUpdateChecklist } from "../lib/affiliateDb";
import type { AffiliateTask, TaskCategory, ChecklistItem } from "../types";
import { PRIORITY_LABELS, PRIORITY_COLORS, CATEGORY_LABELS, CATEGORY_COLORS, WORKFLOW_LABELS } from "../types";

const PRIORITY_ICON: Record<string, React.ReactNode> = {
  high:   <ArrowUp size={13} className="text-[#ff6b35]" />,
  normal: <Minus size={13} className="text-[#6699ff]" />,
  low:    <ArrowDown size={13} className="text-[#6b7194]" />,
};

const TABS: { key: "all" | TaskCategory; label: string }[] = [
  { key: "all",         label: "Все" },
  { key: "task",        label: "Задачи" },
  { key: "instruction", label: "Инструкции" },
  { key: "script",      label: "Скрипты" },
  { key: "access",      label: "Доступы" },
  { key: "creative",    label: "Креативы" },
];

const border = "1px solid rgba(255,255,255,0.07)";

export function AffiliateTasksPage() {
  const { tasks, isLoadingTasks, loadTasks } = useAffiliateStore();
  const [tab, setTab] = useState<"all" | TaskCategory>("all");
  const [search, setSearch] = useState("");
  const [detailTask, setDetailTask] = useState<AffiliateTask | null>(null);
  const [localTasks, setLocalTasks] = useState<AffiliateTask[]>([]);
  const [newCheckItem, setNewCheckItem] = useState("");

  useEffect(() => { loadTasks(); }, []);
  useEffect(() => { setLocalTasks(tasks); }, [tasks]);

  const filtered = localTasks.filter((t) => {
    const matchTab = tab === "all" || t.category === tab;
    const q = search.toLowerCase();
    const matchSearch = !q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  async function toggleCheckItem(task: AffiliateTask, item: ChecklistItem) {
    const updated = task.checklist.map((c) => c.id === item.id ? { ...c, done: !c.done } : c);
    const updatedTask = { ...task, checklist: updated };
    setLocalTasks((prev) => prev.map((t) => t.id === task.id ? updatedTask : t));
    if (detailTask?.id === task.id) setDetailTask(updatedTask);
    await affiliateUpdateChecklist(task.id, updated);
  }

  async function addCheckItem(task: AffiliateTask) {
    if (!newCheckItem.trim()) return;
    const item: ChecklistItem = { id: crypto.randomUUID(), text: newCheckItem.trim(), done: false };
    const updated = [...task.checklist, item];
    const updatedTask = { ...task, checklist: updated };
    setLocalTasks((prev) => prev.map((t) => t.id === task.id ? updatedTask : t));
    if (detailTask?.id === task.id) setDetailTask(updatedTask);
    setNewCheckItem("");
    await affiliateUpdateChecklist(task.id, updated);
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-white">Задачник</h1>
        <p className="text-sm text-[#6b7194] mt-0.5">Задачи от администратора</p>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col gap-2 mb-5 sm:flex-row sm:items-center sm:gap-3">
        <div className="overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible">
          <div className="flex gap-1 rounded-lg p-1 w-max sm:w-auto" style={{ background: "rgba(255,255,255,0.04)", border }}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                tab === t.key ? "bg-[#006AFF] text-white" : "text-[#6b7194] hover:text-[#c0c5e0]"
              }`}>
              {t.label}
            </button>
          ))}
        </div></div>
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4f68]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по задачам..."
            className="w-full pl-8 pr-3 py-2 rounded-lg text-sm text-white placeholder:text-[#4a4f68] outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border }} />
        </div>
      </div>

      {isLoadingTasks ? (
        <div className="flex justify-center pt-10"><Loader2 className="animate-spin text-[#006AFF]" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl p-10 text-center" style={{ background: "rgba(15,17,32,0.6)", border }}>
          <p className="text-[#6b7194] text-sm">
            {search ? `По запросу «${search}» ничего не найдено` : "Задач пока нет"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((task) => (
            <button key={task.id} onClick={() => { setDetailTask(task); setNewCheckItem(""); }}
              className="w-full text-left rounded-xl p-5 transition-all hover:border-[#006AFF]/30"
              style={{ background: "rgba(15,17,32,0.6)", border }}>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {PRIORITY_ICON[task.priority]}
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[task.category]}`}>
                  {CATEGORY_LABELS[task.category]}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority]}`}>
                  {PRIORITY_LABELS[task.priority]}
                </span>
                {task.workflowStatus !== "todo" && (
                  <span className="text-xs text-[#6b7194] ml-auto">{WORKFLOW_LABELS[task.workflowStatus]}</span>
                )}
                {task.dueDate && (
                  <span className="text-xs text-orange-400 ml-auto">до {new Date(task.dueDate).toLocaleDateString("ru-RU")}</span>
                )}
              </div>
              <p className="font-semibold text-white">{task.title}</p>
              {task.description && (
                <p className="text-sm text-[#6b7194] mt-1 line-clamp-2">{task.description}</p>
              )}
              {task.checklist.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-1 flex-1 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full bg-[#006AFF] rounded-full"
                      style={{ width: `${Math.round((task.checklist.filter((c) => c.done).length / task.checklist.length) * 100)}%` }} />
                  </div>
                  <span className="text-xs text-[#6b7194]">
                    {task.checklist.filter((c) => c.done).length}/{task.checklist.length}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {detailTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setDetailTask(null); }}>
          <div className="w-full max-w-xl mx-4 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto" style={{ background: "#0c0e1a", border }}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[detailTask.category]}`}>
                  {CATEGORY_LABELS[detailTask.category]}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[detailTask.priority]}`}>
                  {PRIORITY_LABELS[detailTask.priority]}
                </span>
              </div>
              <button onClick={() => setDetailTask(null)} className="text-[#6b7194] hover:text-white p-1"><X size={18} /></button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">{detailTask.title}</h3>
                {detailTask.description && (
                  <p className="text-sm text-[#a0a5c0] whitespace-pre-line leading-relaxed">{detailTask.description}</p>
                )}
              </div>

              {detailTask.dueDate && (
                <p className="text-xs text-orange-400">Дедлайн: {new Date(detailTask.dueDate).toLocaleDateString("ru-RU")}</p>
              )}

              {/* Workflow status */}
              <div>
                <p className="text-xs font-medium text-[#6b7194] mb-2">Статус</p>
                <span className="text-sm text-white font-medium">{WORKFLOW_LABELS[detailTask.workflowStatus]}</span>
              </div>

              {/* Checklist */}
              <div>
                <p className="text-xs font-medium text-[#6b7194] mb-3">
                  Чек-лист {detailTask.checklist.length > 0 && (
                    <span className="ml-1 text-[#006AFF]">{detailTask.checklist.filter((c) => c.done).length}/{detailTask.checklist.length}</span>
                  )}
                </p>
                <div className="space-y-2">
                  {detailTask.checklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <button onClick={() => toggleCheckItem(detailTask, item)}
                        className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          item.done ? "bg-[#006AFF] border-[#006AFF]" : "border-white/20 hover:border-[#006AFF]/50"
                        }`}>
                        {item.done && <Check size={11} className="text-white" />}
                      </button>
                      <span className={`text-sm flex-1 ${item.done ? "line-through text-[#4a4f68]" : "text-[#c0c5e0]"}`}>{item.text}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 mt-3">
                    <input value={newCheckItem} onChange={(e) => setNewCheckItem(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") addCheckItem(detailTask); }}
                      placeholder="Добавить пункт..."
                      className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder:text-[#4a4f68] outline-none"
                      style={{ background: "rgba(255,255,255,0.04)", border }} />
                    <button onClick={() => addCheckItem(detailTask)} disabled={!newCheckItem.trim()}
                      className="px-3 py-2 bg-[#006AFF]/20 text-[#006AFF] rounded-lg text-sm hover:bg-[#006AFF]/30 disabled:opacity-40 transition-colors">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
