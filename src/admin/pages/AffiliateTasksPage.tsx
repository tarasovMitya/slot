import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, ArrowUp, Minus, ArrowDown, X, CalendarDays, User } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import {
  adminLoadAffiliateTasks,
  adminCreateAffiliateTask,
  adminDeleteAffiliateTask,
  adminLoadAffiliateManagers,
} from "../../affiliate/lib/affiliateDb";
import type { AffiliateTask } from "../../affiliate/types";
import { PRIORITY_LABELS, PRIORITY_COLORS } from "../../affiliate/types";

const PRIORITY_ICON: Record<string, React.ReactNode> = {
  high:   <ArrowUp size={13} className="text-red-500" />,
  normal: <Minus size={13} className="text-yellow-500" />,
  low:    <ArrowDown size={13} className="text-[#6b7194]" />,
};

interface Manager { id: string; name: string; email: string }

const emptyForm = {
  title: "",
  description: "",
  priority: "normal" as "low" | "normal" | "high",
  target: "all",
  dueDate: "",
};

export function AdminAffiliateTasksPage() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<AffiliateTask[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      adminLoadAffiliateTasks(),
      adminLoadAffiliateManagers(),
    ]).then(([t, m]) => {
      setTasks(t);
      setManagers(m);
      setIsLoading(false);
    });
  }, []);

  function managerName(target: string) {
    if (target === "all") return "Все менеджеры";
    const m = managers.find((m) => m.id === target);
    return m ? m.name || m.email : target.slice(0, 8) + "…";
  }

  async function handleCreate() {
    if (!form.title.trim() || !user) return;
    setIsSaving(true);
    await adminCreateAffiliateTask({
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      target: form.target,
      dueDate: form.dueDate || null,
      createdBy: user.id,
    });
    const updated = await adminLoadAffiliateTasks();
    setTasks(updated);
    setForm(emptyForm);
    setShowForm(false);
    setIsSaving(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await adminDeleteAffiliateTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setDeletingId(null);
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Задачи для аффилейтов</h1>
          <p className="text-sm text-[#6b7194] mt-0.5">Постановка задач аффилейт-менеджерам</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#006AFF] text-white rounded-lg text-sm font-medium hover:bg-[#0058d4] transition-colors"
        >
          <Plus size={15} />
          Новая задача
        </button>
      </div>

      {/* Create task modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-lg mx-4 rounded-2xl p-6 shadow-2xl"
            style={{ background: "#0f1120", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Новая задача</h2>
              <button
                onClick={() => { setShowForm(false); setForm(emptyForm); }}
                className="text-[#6b7194] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-[#8b90a8] mb-1.5">Заголовок задачи *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Например: Привлечь 5 новых исполнителей"
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder:text-[#4a4f68] outline-none focus:ring-2 focus:ring-[#006AFF]/40"
                  style={{ background: "#171a28", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-[#8b90a8] mb-1.5">Описание</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Подробнее о задаче…"
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder:text-[#4a4f68] outline-none focus:ring-2 focus:ring-[#006AFF]/40 resize-none"
                  style={{ background: "#171a28", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Priority */}
                <div>
                  <label className="block text-xs font-medium text-[#8b90a8] mb-1.5">Приоритет</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as typeof form.priority }))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none focus:ring-2 focus:ring-[#006AFF]/40 appearance-none"
                    style={{ background: "#171a28", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <option value="low">Низкий</option>
                    <option value="normal">Средний</option>
                    <option value="high">Высокий</option>
                  </select>
                </div>

                {/* Due date */}
                <div>
                  <label className="block text-xs font-medium text-[#8b90a8] mb-1.5">Дедлайн</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none focus:ring-2 focus:ring-[#006AFF]/40"
                    style={{ background: "#171a28", border: "1px solid rgba(255,255,255,0.08)", colorScheme: "dark" }}
                  />
                </div>
              </div>

              {/* Target manager */}
              <div>
                <label className="block text-xs font-medium text-[#8b90a8] mb-1.5">Аффилейт-менеджер</label>
                <select
                  value={form.target}
                  onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none focus:ring-2 focus:ring-[#006AFF]/40 appearance-none"
                  style={{ background: "#171a28", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <option value="all">Все менеджеры</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name || m.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowForm(false); setForm(emptyForm); }}
                className="px-4 py-2 text-sm text-[#6b7194] hover:text-white transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.title.trim() || isSaving}
                className="flex items-center gap-2 px-5 py-2 bg-[#006AFF] text-white rounded-lg text-sm font-medium hover:bg-[#0058d4] transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Создать задачу
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tasks list */}
      {isLoading ? (
        <div className="flex justify-center pt-16">
          <Loader2 className="animate-spin text-[#006AFF]" size={24} />
        </div>
      ) : tasks.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ background: "#0f1120", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-[#6b7194] text-sm">Задач пока нет. Нажмите «Новая задача», чтобы создать первую.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-xl p-5"
              style={{ background: "#0f1120", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  {/* Header row */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {PRIORITY_ICON[task.priority]}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority] ?? ""}`}>
                      {PRIORITY_LABELS[task.priority] ?? task.priority}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[#6b7194]">
                      <User size={11} />
                      {managerName(task.target)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[#6b7194] ml-auto">
                      <CalendarDays size={11} />
                      Поставлена: {new Date(task.createdAt).toLocaleDateString("ru-RU")}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-orange-400 font-medium">
                        до {new Date(task.dueDate).toLocaleDateString("ru-RU")}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <p className="font-semibold text-white">{task.title}</p>

                  {/* Description */}
                  {task.description && (
                    <p className="text-sm text-[#6b7194] mt-1 whitespace-pre-line">{task.description}</p>
                  )}
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(task.id)}
                  disabled={deletingId === task.id}
                  className="shrink-0 p-1.5 rounded-lg text-[#6b7194] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                >
                  {deletingId === task.id
                    ? <Loader2 size={15} className="animate-spin" />
                    : <Trash2 size={15} />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
