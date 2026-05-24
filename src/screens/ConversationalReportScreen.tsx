import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Pressable } from 'react-native';
import { AppShell } from '../components/AppShell';
import { AppHeader } from '../components/AppHeader';
import { BigActionButton } from '../components/BigActionButton';
import { colors, radius, space, type } from '../theme';
import { buildDraftFromFacts, type DraftFromFactsOutput } from '../incidents/draft-from-facts';
import type { ComplaintTemplate } from '../incidents/template-schemas';
import type { OperatorEntry } from '../content/schemas';
import type {
  AppleFmConversationTurn,
  AppleFmIncidentFactsPayload,
} from '../../modules/apple-fm/src/AppleFm.types';

const SYSTEM_PROMPT = [
  "You are AccessMate's incident-report assistant.",
  'Your job is to gather the facts needed to file an accessibility complaint with a UK rail operator.',
  'Ask ONE question at a time, in plain English. Keep questions under 15 words.',
  'Required fields: whenISO (when it happened), operatorName, scenarioId',
  '(one of "missed-passenger-assist", "step-free-route-blocked", "assistance-no-show", "other"), and accompanied (bool).',
  'Optional: staffInteractions, witnesses, waitedMinutes, narrative.',
  'Set isComplete=true the moment all four required fields are filled — do not chit-chat.',
  'Do not give legal advice. Do not promise outcomes.',
].join(' ');

type Bubble = { role: 'assistant' | 'user'; text: string };

interface Props {
  operators: OperatorEntry[];
  templates: ComplaintTemplate[];
  startConversation: (systemPrompt: string) => Promise<string>;
  sendMessage: (sessionId: string, userText: string) => Promise<AppleFmConversationTurn>;
  endConversation: (sessionId: string) => Promise<void>;
  onComplete: (draft: DraftFromFactsOutput) => void;
  onSwitchToForm: (capturedFacts: AppleFmIncidentFactsPayload) => void;
  transparent?: boolean;
}

export function ConversationalReportScreen({
  operators,
  templates,
  startConversation,
  sendMessage,
  endConversation,
  onComplete,
  onSwitchToForm,
  transparent = false,
}: Props) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [draft, setDraft] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [facts, setFacts] = useState<AppleFmIncidentFactsPayload>({});
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const id = await startConversation(SYSTEM_PROMPT);
        if (!alive) return;
        setSessionId(id);
        setThinking(true);
        const turn = await sendMessage(id, 'Please greet the user and ask the first question.');
        if (!alive) return;
        applyTurn(turn);
      } catch {
        setBubbles([
          { role: 'assistant', text: "I'm having trouble starting. Use the form instead." },
        ]);
      } finally {
        if (alive) setThinking(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyTurn(turn: AppleFmConversationTurn) {
    setBubbles((b) => [...b, { role: 'assistant', text: turn.assistantText }]);
    if (turn.facts) setFacts((prev) => ({ ...prev, ...turn.facts }));
    if (turn.isComplete) {
      finalize({ ...facts, ...(turn.facts ?? {}) });
    }
  }

  function finalize(captured: AppleFmIncidentFactsPayload) {
    const template = templates.find((t) => t.id === captured.scenarioId) ?? templates[0];
    const operator = operators.find((o) => o.name === captured.operatorName) ?? undefined;
    const built = buildDraftFromFacts({
      whenISO: captured.whenISO ?? new Date().toISOString(),
      operator,
      template,
      accompanied: captured.accompanied ?? undefined,
      narrative: captured.narrative ?? undefined,
      staffInteractions: captured.staffInteractions ?? undefined,
      witnesses: captured.witnesses ?? undefined,
      waitedMinutes: captured.waitedMinutes ?? undefined,
    });
    if (sessionId) {
      void endConversation(sessionId);
    }
    onComplete(built);
  }

  async function onSend() {
    const text = draft.trim();
    if (!text || !sessionId) return;
    setBubbles((b) => [...b, { role: 'user', text }]);
    setDraft('');
    setThinking(true);
    try {
      const turn = await sendMessage(sessionId, text);
      applyTurn(turn);
    } catch {
      setBubbles((b) => [
        ...b,
        { role: 'assistant', text: 'Something went wrong. Try Switch to form.' },
      ]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <AppShell back={false} transparent={transparent} scroll={false}>
      <AppHeader title="New report" overline="Talking it through" />
      <Pressable
        accessibilityRole="button"
        onPress={() => onSwitchToForm(facts)}
        style={styles.switchLink}
      >
        <Text style={styles.switchLinkText}>Switch to form</Text>
      </Pressable>

      <ScrollView
        ref={scrollRef}
        style={styles.thread}
        contentContainerStyle={styles.threadContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {bubbles.map((b, i) => (
          <View
            key={i}
            style={[styles.bubble, b.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}
          >
            <Text style={styles.bubbleText}>{b.text}</Text>
          </View>
        ))}
        {thinking && (
          <View style={[styles.bubble, styles.bubbleAssistant]}>
            <Text style={[styles.bubbleText, styles.thinking]}>…thinking</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message"
          placeholderTextColor={colors.ink.soft}
          value={draft}
          onChangeText={setDraft}
          accessibilityLabel="Your message"
          multiline
        />
        <BigActionButton label="Send" hint="Send your message to the assistant" onPress={onSend} />
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  switchLink: { alignSelf: 'flex-end', paddingVertical: space.xs },
  switchLinkText: { ...type.caption, color: colors.accent.deep, textDecorationLine: 'underline' },
  thread: { flex: 1, marginVertical: space.sm },
  threadContent: { gap: space.sm, paddingBottom: space.lg },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
  },
  bubbleAssistant: { backgroundColor: colors.bg.raised, alignSelf: 'flex-start' },
  bubbleUser: { backgroundColor: colors.accent.deep, alignSelf: 'flex-end' },
  bubbleText: { ...type.body, color: colors.ink.primary },
  thinking: { color: colors.ink.muted, fontStyle: 'italic' },
  composer: { gap: space.sm, marginTop: space.sm },
  input: {
    ...type.body,
    color: colors.ink.primary,
    borderWidth: 1,
    borderColor: colors.line.hairline,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    minHeight: 80,
  },
});
