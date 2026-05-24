export type AppleFmUnavailableReason =
  | 'unsupported-device'
  | 'apple-intelligence-not-enabled'
  | 'model-not-ready'
  | 'unknown';

export type AppleFmAvailability =
  | { available: true }
  | { available: false; reason: AppleFmUnavailableReason };

/** Mirror of the Swift @Generable IncidentFactsPayload — every field
 *  optional because the model populates them progressively. */
export interface AppleFmIncidentFactsPayload {
  whenISO?: string | null;
  operatorName?: string | null;
  scenarioId?: string | null;
  narrative?: string | null;
  accompanied?: boolean | null;
  staffInteractions?: string | null;
  witnesses?: string | null;
  waitedMinutes?: number | null;
}

export interface AppleFmConversationTurn {
  assistantText: string;
  isComplete: boolean;
  facts?: AppleFmIncidentFactsPayload;
}

export interface AppleFmNativeModule {
  isAvailable(): Promise<boolean>;
  getAvailability(): Promise<AppleFmAvailability>;
  polish(prompt: string, systemPrompt: string): Promise<string>;

  /** Start a new multi-turn session; returns a UUID. The native side
   *  retains the LanguageModelSession until endConversation is called. */
  startConversation(systemPrompt: string): Promise<string>;
  /** Send the next user message; returns the assistant's reply plus a
   *  best-effort structured payload of facts captured so far. */
  sendMessage(sessionId: string, userText: string): Promise<AppleFmConversationTurn>;
  /** Tear down the native session. Safe to call on an unknown id. */
  endConversation(sessionId: string): Promise<void>;
}
