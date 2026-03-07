import React, { createContext, useState, useCallback } from "react";

interface KidSetup {
  username: string;
  password: string;
  color: string;
}

interface WizardContextType {
  isNewUser: boolean;
  currentStep: "parent_info" | "add_kids" | "complete";
  parentInfo: { username: string; password: string } | null;
  kids: KidSetup[];
  setIsNewUser: (val: boolean) => void;
  setCurrentStep: (step: "parent_info" | "add_kids" | "complete") => void;
  setParentInfo: (info: { username: string; password: string }) => void;
  addKid: (kid: KidSetup) => void;
  removeKid: (index: number) => void;
  resetWizard: () => void;
}

export const WizardContext = createContext<WizardContextType | undefined>(
  undefined
);

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [isNewUser, setIsNewUser] = useState(false);
  const [currentStep, setCurrentStep] = useState<"parent_info" | "add_kids" | "complete">("parent_info");
  const [parentInfo, setParentInfo] = useState<{ username: string; password: string } | null>(null);
  const [kids, setKids] = useState<KidSetup[]>([]);

  const addKid = useCallback((kid: KidSetup) => {
    setKids((prev) => [...prev, kid]);
  }, []);

  const removeKid = useCallback((index: number) => {
    setKids((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const resetWizard = useCallback(() => {
    setIsNewUser(false);
    setCurrentStep("parent_info");
    setParentInfo(null);
    setKids([]);
  }, []);

  return (
    <WizardContext.Provider
      value={{
        isNewUser,
        currentStep,
        parentInfo,
        kids,
        setIsNewUser,
        setCurrentStep,
        setParentInfo,
        addKid,
        removeKid,
        resetWizard,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizardContext() {
  const context = React.useContext(WizardContext);
  if (!context) {
    throw new Error("useWizardContext must be used within WizardProvider");
  }
  return context;
}
