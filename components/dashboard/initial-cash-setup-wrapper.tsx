"use client";

import { useEffect, useState } from "react";
import { InitialCashSetupModal } from "./initial-cash-setup-modal";

interface InitialCashSetupWrapperProps {
  needsSetup: boolean;
}

export function InitialCashSetupWrapper({ needsSetup }: InitialCashSetupWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);

  useEffect(() => {
    // Check if modal was already shown in this session
    const shownInSession = sessionStorage.getItem("initial_cash_modal_shown");
    
    if (needsSetup && !shownInSession && !hasShownModal) {
      setIsOpen(true);
      setHasShownModal(true);
      sessionStorage.setItem("initial_cash_modal_shown", "true");
    }
  }, [needsSetup, hasShownModal]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSave = () => {
    setIsOpen(false);
    // Refresh the page to show updated stats
    window.location.reload();
  };

  return (
    <InitialCashSetupModal
      isOpen={isOpen}
      onClose={handleClose}
      onSave={handleSave}
    />
  );
}
