'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { AssessmentForSolvingDto } from '../../../types/study-cycle-types';

interface AssessmentContextType {
  assessment: AssessmentForSolvingDto;
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export const AssessmentProvider = ({
  children,
  assessment,
}: {
  children: ReactNode;
  assessment: AssessmentForSolvingDto;
}) => {
  return (
    <AssessmentContext.Provider value={{ assessment }}>
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessment = (): AssessmentContextType => {
  const context = useContext(AssessmentContext);
  if (context === undefined) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
}; 