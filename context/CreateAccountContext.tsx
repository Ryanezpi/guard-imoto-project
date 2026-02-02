import React, { createContext, useContext, useMemo, useState } from 'react';

type CreateAccountDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreedToPrivacy: boolean;
  emailAvailable: boolean | null;
  emailCheckedValue: string;
};

type CreateAccountContextValue = {
  draft: CreateAccountDraft;
  setDraft: (patch: Partial<CreateAccountDraft>) => void;
  resetDraft: () => void;
};

const defaultDraft: CreateAccountDraft = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  agreedToPrivacy: false,
  emailAvailable: null,
  emailCheckedValue: '',
};

const CreateAccountContext = createContext<CreateAccountContextValue | null>(
  null
);

export function CreateAccountProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [draft, setDraftState] = useState<CreateAccountDraft>(defaultDraft);

  const setDraft = (patch: Partial<CreateAccountDraft>) => {
    setDraftState((prev) => ({ ...prev, ...patch }));
  };

  const resetDraft = () => setDraftState(defaultDraft);

  const value = useMemo(
    () => ({
      draft,
      setDraft,
      resetDraft,
    }),
    [draft]
  );

  return (
    <CreateAccountContext.Provider value={value}>
      {children}
    </CreateAccountContext.Provider>
  );
}

export function useCreateAccountDraft() {
  const ctx = useContext(CreateAccountContext);
  if (!ctx) {
    throw new Error(
      'useCreateAccountDraft must be used within CreateAccountProvider'
    );
  }
  return ctx;
}
