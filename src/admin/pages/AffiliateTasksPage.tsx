import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, ArrowUp, Minus, ArrowDown, X, CalendarDays, User, Search, Check } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import {
  adminLoadAffiliateTasks,
  adminCreateAffiliateTask,
  adminUpdateAffiliateTask,
  adminDeleteAffiliateTask,
  adminLoadAffiliateManagers,
} from "../../affiliate/lib/affiliateDb";
import type { AffiliateTask, TaskCategory, TaskWorkflowStatus, ChecklistItem } from "../../affiliate/types";
import {
  PRIORITY_COLORS, CATEGORY_LABELS, CATEGORY_COLORS, WORKFLOW_LABELS,
} from "../../affiliate/types";

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

interface Manager { id: string; name: string; email: string }

const emptyForm = {
  title: "", description: "", priority: "normal" as "low" | "normal" | "high",
  target: "all", dueDate: "", category: "task" as TaskCategory,
};

export function AdminAffiliateTasksPage() {
  const { user } = useAuthStore();
  const [tasks, setTasks]       = useState<AffiliateTask[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [tab, setTab]           = useState<"all" | TaskCategory>("all");
  const [search, setSearch]     = useState("");
  const [detailTask, setDetailTask] = useState<AffiliateTask | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState(emptyForm);
  const [newCheckItem, setNewCheckItem] = useState("");

  useEffect(() => {
    Promise.all([adminLoadAffiliateTasks(), adminLoadAffiliateManagers()]).then(([t, m]) => {
      setTasks(t); setManagers(m); setIsLoading(false);
    });
  }, []);

  const filtered = tasks.filter((t) => {
    const matchTab = tab === "all" || t.category === tab;
    const q = search.toLowerCase();
    const matchSearch = !q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  function managerName(target: string) {
    if (target === "all") return "Все менеджеры";
    const m = managers.find((m) => m.id === target);
    return m ? (m.name || m.email) : target.slice(0, 8) + "…";
  }

  async function handleCreate() {
    if (!form.title.trim() || !user) return;
    setIsSaving(true);
    await adminCreateAffiliateTask({
      title: form.title.trim(), description: form.description.trim(),
      priority: form.priority, target: form.target,
      dueDate: form.dueDate || null, createdBy: user.id, category: form.category,
    });
    const updated = await adminLoadAffiliateTasks();
    setTasks(updated); setForm(emptyForm); setShowForm(false); setIsSaving(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await adminDeleteAffiliateTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (detailTask?.id === id) setDetailTask(null);
    setDeletingId(null);
  }

  function openDetail(task: AffiliateTask) {
    setDetailTask(task);
    setEditMode(false);
    setEditForm({ title: task.title, description: task.description,
      priority: task.priority, target: task.target,
      dueDate: task.dueDate ?? "", category: task.category });
  }

  async function saveEdit() {
    if (!detailTask) return;
    setIsSaving(true);
    await adminUpdateAffiliateTask(detailTask.id, {
      title: editForm.title, description: editForm.description,
      priority: editForm.priority, target: editForm.target,
      dueDate: editForm.dueDate || null, category: editForm.category,
    });
    const updated = await adminLoadAffiliateTasks();
    setTasks(updated);
    const refreshed = updated.find((t) => t.id === detailTask.id);
    if (refreshed) setDetailTask(refreshed);
    setEditMode(false); setIsSaving(false);
  }

  async function toggleCheckItem(item: ChecklistItem) {
    if (!detailTask) return;
    const updated = detailTask.checklist.map((c) =>
      c.id === item.id ? { ...c, done: !c.done } : c
    );
    await adminUpdateAffiliateTask(detailTask.id, { checklist: updated });
    const updatedTask = { ...detailTask, checklist: updated };
    setDetailTask(updatedTask);
    setTasks((prev) => prev.map((t) => t.id === detailTask.id ? updatedTask : t));
  }

  async function addCheckItem() {
    if (!detailTask || !newCheckItem.trim()) return;
    const item: ChecklistItem = { id: crypto.randomUUID(), text: newCheckItem.trim(), done: false };
    const updated = [...detailTask.checklist, item];
    await adminUpdateAffiliateTask(detailTask.id, { checklist: updated });
    const updatedTask = { ...detailTask, checklist: updated };
    setDetailTask(updatedTask);
    setTasks((prev) => prev.map((t) => t.id === detailTask.id ? updatedTask : t));
    setNewCheckItem("");
  }

  async function deleteCheckItem(id: string) {
    if (!detailTask) return;
    const updated = detailTask.checklist.filter((c) => c.id !== id);
    await adminUpdateAffiliateTask(detailTask.id, { checklist: updated });
    const updatedTask = { ...detailTask, checklist: updated };
    setDetailTask(updatedTask);
    setTasks((prev) => prev.map((t) => t.id === detailTask.id ? updatedTask : t));
  }

  async function changeWorkflowStatus(status: TaskWorkflowStatus) {
    if (!detailTask) return;
    await adminUpdateAffiliateTask(detailTask.id, { workflowStatus: status });
    const updatedTask = { ...detailTask, workflowStatus: status };
    setDetailTask(updatedTask);
    setTasks((prev) => prev.map((t) => t.id === detailTask.id ? updatedTask : t));
  }

  const border = "1px solid rgba(255,255,255,0.07)";

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Задачник аффилейтов</h1>
          <p className="text-sm text-[#6b7194] mt-0.5">Постановка задач менеджерам</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#006AFF] text-white rounded-lg text-sm font-medium hover:bg-[#0058d4] transition-colors"
        >
          <Plus size={15} /> Новая задача
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex gap-1 rounded-lg p-1" style={{ background: "rgba(255,255,255,0.04)", border }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                tab === t.key
                  ? "bg-[#006AFF] text-white"
                  : "text-[#6b7194] hover:text-[#c0c5e0]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4f68]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по задачам..."
            className="w-full pl-8 pr-3 py-2 rounded-lg text-sm text-white placeholder:text-[#4a4f68] outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border }}
          />
        </div>
      </div>

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-4 rounded-2xl p-6 shadow-2xl" style={{ background: "#0f1120", border }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Новая задача</h2>
              <button onClick={() => { setShowForm(false); setForm(emptyForm); }} className="text-[#6b7194] hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#8b90a8] mb-1.5">Заголовок *</label>
                <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Например: Привлечь 5 новых исполнителей"
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder:text-[#4a4f68] outline-none focus:ring-2 focus:ring-[#006AFF]/40"
                  style={{ background: "#171a28", border }} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8b90a8] mb-1.5">Описание</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Подробнее о задаче…"
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder:text-[#4a4f68] outline-none focus:ring-2 focus:ring-[#006AFF]/40 resize-none"
                  style={{ background: "#171a28", border }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#8b90a8] mb-1.5">Тип</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as TaskCategory }))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none appearance-none"
                    style={{ background: "#171a28", border }}>
                    <option value="task">Задача</option>
                    <option value="instruction">Инструкция</option>
                    <option value="script">Скрипт</option>
                    <option value="access">Доступ</option>
                    <option value="creative">Креатив</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8b90a8] mb-1.5">Приоритет</label>
                  <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as typeof form.priority }))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none appearance-none"
                    style={{ background: "#171a28", border }}>
                    <option value="low">Низкий</option>
                    <option value="normal">Средний</option>
                    <option value="high">Высокий</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#8b90a8] mb-1.5">Дедлайн</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none"
                    style={{ background: "#171a28", border, colorScheme: "dark" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8b90a8] mb-1.5">Аффилейт-менеджер</label>
                  <select value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none appearance-none"
                    style={{ background: "#171a28", border }}>
                    <option value="all">Все менеджеры</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name || m.email || m.id.slice(0, 8) + "…"}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={() => { setShowForm(false); setForm(emptyForm); }} className="px-4 py-2 text-sm text-[#6b7194] hover:text-white transition-colors">Отмена</button>
              <button onClick={handleCreate} disabled={!form.title.trim() || isSaving}
                className="flex items-center gap-2 px-5 py-2 bg-[#006AFF] text-white rounded-lg text-sm font-medium hover:bg-[#0058d4] transition-colors disabled:opacity-50">
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Создать задачу
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detailTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) { setDetailTask(null); setEditMode(false); } }}>
          <div className="w-full max-w-2xl mx-4 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto" style={{ background: "#0c0e1a", border }}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[detailTask.category]}`}>
                  {CATEGORY_LABELS[detailTask.category]}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[detailTask.priority]}`}>
                  {PRIORITY_ICON[detailTask.priority]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!editMode && (
                  <button onClick={() => setEditMode(true)} className="text-xs px-3 py-1.5 rounded-lg text-[#6b7194] hover:text-white hover:bg-white/[0.06] transition-all">Редактировать</button>
                )}
                <button onClick={() => handleDelete(detailTask.id)} disabled={deletingId === detailTask.id}
                  className="text-[#6b7194] hover:text-red-400 transition-colors p-1">
                  {deletingId === detailTask.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                </button>
                <button onClick={() => { setDetailTask(null); setEditMode(false); }} className="text-[#6b7194] hover:text-white transition-colors p-1">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Title / edit */}
              {editMode ? (
                <div className="space-y-3">
                  <input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg text-base font-semibold text-white outline-none focus:ring-2 focus:ring-[#006AFF]/40"
                    style={{ background: "#171a28", border }} />
                  <textarea rows={6} value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none focus:ring-2 focus:ring-[#006AFF]/40 resize-none"
                    style={{ background: "#171a28", border }} />
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-[#6b7194] mb-1">Тип</label>
                      <select value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value as TaskCategory }))}
                        className="w-full px-2 py-2 rounded-lg text-sm text-white outline-none appearance-none" style={{ background: "#171a28", border }}>
                        <option value="task">Задача</option>
                        <option value="instruction">Инструкция</option>
                        <option value="script">Скрипт</option>
                        <option value="access">Доступ</option>
                        <option value="creative">Креатив</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-[#6b7194] mb-1">Приоритет</label>
                      <select value={editForm.priority} onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value as typeof editForm.priority }))}
                        className="w-full px-2 py-2 rounded-lg text-sm text-white outline-none appearance-none" style={{ background: "#171a28", border }}>
                        <option value="low">Низкий</option>
                        <option value="normal">Средний</option>
                        <option value="high">Высокий</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-[#6b7194] mb-1">Дедлайн</label>
                      <input type="date" value={editForm.dueDate} onChange={(e) => setEditForm((f) => ({ ...f, dueDate: e.target.value }))}
                        className="w-full px-2 py-2 rounded-lg text-sm text-white outline-none" style={{ background: "#171a28", border, colorScheme: "dark" }} />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => setEditMode(false)} className="text-sm text-[#6b7194] hover:text-white px-4 py-2">Отмена</button>
                    <button onClick={saveEdit} disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-[#006AFF] text-white rounded-lg text-sm font-medium hover:bg-[#0058d4] disabled:opacity-50">
                      {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Сохранить
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">{detailTask.title}</h3>
                    {detailTask.description && (
                      <p className="text-sm text-[#a0a5c0] whitespace-pre-line leading-relaxed">{detailTask.description}</p>
                    )}
                  </div>
                </>
              )}

              {/* Meta row */}
              {!editMode && (
                <div className="flex items-center gap-4 text-xs text-[#6b7194] flex-wrap">
                  <span className="flex items-center gap-1"><User size={11} /> {managerName(detailTask.target)}</span>
                  <span className="flex items-center gap-1"><CalendarDays size={11} /> {new Date(detailTask.createdAt).toLocaleDateString("ru-RU")}</span>
                  {detailTask.dueDate && <span className="text-orange-400">до {new Date(detailTask.dueDate).toLocaleDateString("ru-RU")}</span>}
                </div>
              )}

              {/* Workflow status */}
              {!editMode && (
                <div>
                  <p className="text-xs font-medium text-[#6b7194] mb-2">Статус</p>
                  <div className="flex gap-2 flex-wrap">
                    {(Object.entries(WORKFLOW_LABELS) as [TaskWorkflowStatus, string][]).map(([k, label]) => (
                      <button key={k} onClick={() => changeWorkflowStatus(k)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          detailTask.workflowStatus === k
                            ? "bg-[#006AFF] text-white"
                            : "text-[#6b7194] hover:text-white"
                        }`}
                        style={detailTask.workflowStatus !== k ? { background: "rgba(255,255,255,0.04)", border } : {}}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Checklist */}
              {!editMode && (
                <div>
                  <p className="text-xs font-medium text-[#6b7194] mb-3">
                    Чек-лист {detailTask.checklist.length > 0 && (
                      <span className="ml-1 text-[#006AFF]">{detailTask.checklist.filter((c) => c.done).length}/{detailTask.checklist.length}</span>
                    )}
                  </p>
                  <div className="space-y-2">
                    {detailTask.checklist.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 group">
                        <button onClick={() => toggleCheckItem(item)}
                          className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            item.done ? "bg-[#006AFF] border-[#006AFF]" : "border-white/20 hover:border-[#006AFF]/50"
                          }`}>
                          {item.done && <Check size={11} className="text-white" />}
                        </button>
                        <span className={`text-sm flex-1 ${item.done ? "line-through text-[#4a4f68]" : "text-[#c0c5e0]"}`}>{item.text}</span>
                        <button onClick={() => deleteCheckItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 text-[#4a4f68] hover:text-red-400 transition-all">
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 mt-3">
                      <input value={newCheckItem} onChange={(e) => setNewCheckItem(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") addCheckItem(); }}
                        placeholder="Добавить пункт..."
                        className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder:text-[#4a4f68] outline-none"
                        style={{ background: "rgba(255,255,255,0.04)", border }} />
                      <button onClick={addCheckItem} disabled={!newCheckItem.trim()}
                        className="px-3 py-2 bg-[#006AFF]/20 text-[#006AFF] rounded-lg text-sm hover:bg-[#006AFF]/30 disabled:opacity-40 transition-colors">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task list */}
      {isLoading ? (
        <div className="flex justify-center pt-16"><Loader2 className="animate-spin text-[#006AFF]" size={24} /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{ background: "rgba(15,17,32,0.6)", border }}>
          <p className="text-[#6b7194] text-sm">
            {search ? `По запросу «${search}» ничего не найдено` : "Задач пока нет"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((task) => (
            <button key={task.id} onClick={() => openDetail(task)} className="w-full text-left rounded-xl p-5 transition-all hover:border-[#006AFF]/30 hover:bg-[#0f1120]"
              style={{ background: "rgba(15,17,32,0.6)", border }}>
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {PRIORITY_ICON[task.priority]}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[task.category]}`}>
                      {CATEGORY_LABELS[task.category]}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[#6b7194]">
                      <User size={11} /> {managerName(task.target)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[#6b7194] ml-auto">
                      <CalendarDays size={11} /> {new Date(task.createdAt).toLocaleDateString("ru-RU")}
                    </span>
                    {task.dueDate && <span className="text-xs text-orange-400 font-medium">до {new Date(task.dueDate).toLocaleDateString("ru-RU")}</span>}
                  </div>
                  <p className="font-semibold text-white">{task.title}</p>
                  {task.description && (
                    <p className="text-sm text-[#6b7194] mt-1 line-clamp-2">{task.description}</p>
                  )}
                  {task.checklist.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="h-1 flex-1 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full bg-[#006AFF] rounded-full transition-all"
                          style={{ width: `${Math.round((task.checklist.filter((c) => c.done).length / task.checklist.length) * 100)}%` }} />
                      </div>
                      <span className="text-xs text-[#6b7194] shrink-0">
                        {task.checklist.filter((c) => c.done).length}/{task.checklist.length}
                      </span>
                    </div>
                  )}
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }} disabled={deletingId === task.id}
                  className="shrink-0 p-1.5 rounded-lg text-[#6b7194] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40">
                  {deletingId === task.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                </button>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
