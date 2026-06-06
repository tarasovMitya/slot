import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Clock, XCircle, Loader2, Check, ClipboardList, TrendingUp, CalendarDays } from "lucide-react";
import { usePerformerStore } from "../store/performerStore";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";
import { VerificationForm } from "./VerificationForm";

interface VerificationGateProps {
  children: React.ReactNode;
}

export function VerificationGate({ children }: VerificationGateProps) {
  const { verificationStatus: storeStatus, rejectionReason: storeReason, isHydrated, setVerificationStatus, profile } = usePerformerStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [status, setStatus] = useState(storeStatus);
  const [reason, setReason] = useState(storeReason);
  const [checking, setChecking] = useState(!isHydrated);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (isHydrated && checking) {
      setStatus(storeStatus);
      setReason(storeReason);
      setChecking(false);
      return;
    }
    if (!isHydrated && user?.id) {
      supabase
        .from("performer_profiles")
        .select("verification_status, rejection_reason")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          const s = (data?.verification_status as string) ?? "not_started";
          const r = (data?.rejection_reason as string) ?? null;
          setStatus(s);
          setReason(r);
          setVerificationStatus(s, r);
          setChecking(false);
        }, () => setChecking(false));
    }
  }, [isHydrated, user?.id]);

  useEffect(() => {
    setStatus(storeStatus);
    setReason(storeReason);
  }, [storeStatus, storeReason]);

  // Store submission timestamp the first time we detect pending status
  useEffect(() => {
    if (status === "pending" && !localStorage.getItem("performer_verification_submitted_at")) {
      localStorage.setItem("performer_verification_submitted_at", new Date().toISOString());
    }
  }, [status]);

  // Show welcome screen once on first approval
  useEffect(() => {
    if (status === "approved" && !localStorage.getItem("performer_first_approval_seen")) {
      setShowWelcome(true);
    }
  }, [status]);

  if (checking) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="text-gray-300 animate-spin" />
      </div>
    );
  }

  if (status === "approved") {
    if (showWelcome) {
      const firstName = profile.name ? profile.name.split(" ")[0] : "";
      return (
        <div className="max-w-lg mx-auto px-4 pt-16 pb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm"
          >
            <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-5">
              <ShieldCheck size={28} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {firstName ? `${firstName}, добро пожаловать!` : "Поздравляем!"}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Вы прошли проверку и готовы принимать заказы. Включите режим «Онлайн» чтобы начать.
            </p>
            <button
              onClick={() => {
                localStorage.setItem("performer_first_approval_seen", "1");
                setShowWelcome(false);
              }}
              className="w-full py-3.5 rounded-2xl bg-[#006AFF] text-white font-semibold text-sm hover:bg-[#004CB8] transition-all active:scale-95"
            >
              Перейти в кабинет
            </button>
          </motion.div>
        </div>
      );
    }
    return <>{children}</>;
  }

  if (status === "not_started") {
    return <VerificationForm inline />;
  }

  if (status === "pending") {
    const submittedAt = localStorage.getItem("performer_verification_submitted_at");
    const formattedDate = submittedAt
      ? new Date(submittedAt).toLocaleString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
      : null;

    return (
      <div className="max-w-lg mx-auto px-4 pt-10 pb-10">
        {/* 3-step progress */}
        <div className="flex items-start mb-8 px-2">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <Check size={14} className="text-green-600" />
            </div>
            <span className="text-[11px] text-green-600 font-medium mt-1.5 text-center leading-tight">
              Анкета<br />подана
            </span>
          </div>
          <div className="flex-1 h-0.5 bg-amber-300 mt-4 mx-2" />
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-amber-50 border-2 border-amber-400 flex items-center justify-center">
              <Clock size={14} className="text-amber-500" />
            </div>
            <span className="text-[11px] text-amber-600 font-semibold mt-1.5 text-center leading-tight">
              Проверка<br />документов
            </span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200 mt-4 mx-2" />
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <ShieldCheck size={14} className="text-gray-400" />
            </div>
            <span className="text-[11px] text-gray-400 font-medium mt-1.5 text-center leading-tight">
              Доступ<br />открыт
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Ваша анкета на проверке</h2>
          {formattedDate && (
            <p className="text-xs text-gray-400 mb-4">Подана {formattedDate}</p>
          )}
          <p className="text-sm text-gray-500 mb-5">
            Мы проверяем ваши документы и данные. Результат придёт на email, указанный при регистрации.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">После одобрения откроется</p>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                  <ClipboardList size={10} className="text-gray-400" />
                </div>
                <span className="text-sm text-gray-600">Новые заказы рядом с вами</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                  <TrendingUp size={10} className="text-gray-400" />
                </div>
                <span className="text-sm text-gray-600">Заработок и выплаты</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                  <CalendarDays size={10} className="text-gray-400" />
                </div>
                <span className="text-sm text-gray-600">Управление расписанием</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <p className="text-sm font-semibold text-amber-700">Среднее время проверки — до 24 часов</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="max-w-lg mx-auto px-4 pt-16 pb-10">
        <div className="bg-white border border-red-100 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
            <XCircle size={28} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Верификация отклонена</h2>
          {reason && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs font-semibold text-red-500 mb-1 uppercase tracking-wider">Причина отказа</p>
              <p className="text-sm text-red-700">{reason}</p>
            </div>
          )}
          <p className="text-sm text-gray-500 mb-6">
            Исправьте указанные замечания и отправьте анкету повторно.
          </p>
          <button
            onClick={() => navigate("/performer/verification")}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
          >
            Отправить повторно
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-16 pb-10">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-5">
          <ShieldCheck size={28} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Доступ ограничен</h2>
        <p className="text-sm text-gray-500 mb-6">
          Что-то пошло не так с вашим статусом верификации. Напишите нам — разберёмся.
        </p>
        <a
          href="mailto:support@slot.ru"
          className="w-full inline-block px-6 py-3 bg-[#006AFF] text-white rounded-xl font-semibold text-sm hover:bg-[#004CB8] transition-colors"
        >
          Написать в поддержку
        </a>
      </div>
    </div>
  );
}
