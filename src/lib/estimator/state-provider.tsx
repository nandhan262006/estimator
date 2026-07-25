"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type {
  ActiveRecommendation,
  DeliverableGroup,
  EstimateBreakdown,
  EventTemplate,
  EstimatorState,
} from "./types";
import { calculateEstimate } from "./pricing";
import {
  generateDeliverables,
  generateDeliverableTexts,
} from "./deliverables";
import { evaluateRecommendations } from "./recommendations";
import {
  estimatorReducer,
  initialState,
  type EstimatorAction,
} from "./state";

const EMPTY_ESTIMATE: EstimateBreakdown = {
  items: [],
  total: 0,
  subEventCount: 0,
  isEmpty: true,
};

interface EstimatorContextValue {
  state: EstimatorState;
  dispatch: React.Dispatch<EstimatorAction>;
  templates: EventTemplate[];
  template: EventTemplate | null;
  estimate: EstimateBreakdown;
  deliverables: DeliverableGroup[];
  deliverableTexts: string[];
  recommendations: ActiveRecommendation[];
}

const EstimatorContext = createContext<EstimatorContextValue | null>(null);

export function EstimatorProvider({
  templates,
  children,
}: {
  templates: EventTemplate[];
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(estimatorReducer, initialState);

  const template = useMemo(
    () => templates.find((t) => t.id === state.eventTypeId) ?? null,
    [templates, state.eventTypeId],
  );

  const estimate = useMemo(
    () => (template ? calculateEstimate(state, template) : EMPTY_ESTIMATE),
    [state, template],
  );

  const deliverables = useMemo(
    () => (template ? generateDeliverables(state, template) : []),
    [state, template],
  );

  const deliverableTexts = useMemo(
    () => (template ? generateDeliverableTexts(state, template) : []),
    [state, template],
  );

  const recommendations = useMemo(
    () => (template ? evaluateRecommendations(state, template) : []),
    [state, template],
  );

  useEffect(() => {
    if (!state.estimatedDate && template && !estimate.isEmpty) {
      dispatch({
        type: "SET_ESTIMATED_DATE",
        value: new Date().toISOString().slice(0, 10),
      });
    }
  }, [template, estimate.isEmpty, state.estimatedDate, dispatch]);

  const value = useMemo<EstimatorContextValue>(
    () => ({
      state,
      dispatch,
      templates,
      template,
      estimate,
      deliverables,
      deliverableTexts,
      recommendations,
    }),
    [state, dispatch, templates, template, estimate, deliverables, deliverableTexts, recommendations],
  );

  return (
    <EstimatorContext.Provider value={value}>
      {children}
    </EstimatorContext.Provider>
  );
}

export function useEstimator(): EstimatorContextValue {
  const ctx = useContext(EstimatorContext);
  if (!ctx) {
    throw new Error("useEstimator must be used within an EstimatorProvider");
  }
  return ctx;
}
