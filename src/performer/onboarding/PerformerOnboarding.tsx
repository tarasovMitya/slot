import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useOnboardingStore } from "./store/onboardingStore";
import { usePerformerStore } from "../store/performerStore";
import { OnboardingLayout } from "./components/OnboardingLayout";
import { Step1Basic } from "./steps/Step1Basic";
import { Step2Skills } from "./steps/Step2Skills";
import { Step3Experience } from "./steps/Step3Experience";
import { Step4Location } from "./steps/Step4Location";
import { Step5Radius } from "./steps/Step5Radius";
import { Step6Documents } from "./steps/Step6Documents";
import { Step7Availability } from "./steps/Step7Availability";
import { Step8Summary } from "./steps/Step8Summary";

export function PerformerOnboarding() {
  const navigate = useNavigate();
  const { step, name, phone, email, skills, city, address, radius, complete, reset } =
    useOnboardingStore();
  const { updateProfile } = usePerformerStore();

  const handleComplete = () => {
    // Populate performer store with collected onboarding data
    updateProfile({
      name: name || "Новый исполнитель",
      phone,
      address,
      city,
      workRadius: radius,
      specializations: skills,
    });
    complete();
    reset();
    navigate("/performer");
  };

  const stepContent = {
    1: <Step1Basic />,
    2: <Step2Skills />,
    3: <Step3Experience />,
    4: <Step4Location />,
    5: <Step5Radius />,
    6: <Step6Documents />,
    7: <Step7Availability />,
    8: <Step8Summary onComplete={handleComplete} />,
  }[step];

  return (
    <OnboardingLayout step={step}>
      <AnimatePresence mode="wait">
        <div key={step}>
          {stepContent}
        </div>
      </AnimatePresence>
    </OnboardingLayout>
  );
}
