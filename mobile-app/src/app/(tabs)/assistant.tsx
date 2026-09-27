import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/mira/app-text';
import { TAB_BAR_CLEARANCE } from '@/components/mira/bottom-nav';
import { ChatBubble } from '@/components/mira/chat-bubble';
import { Chip } from '@/components/mira/chip';
import { Mascot, MascotMini } from '@/components/mira/mascot';
import { TypingDots } from '@/components/mira/typing-dots';
import { ChatMessage, chatSuggestions } from '@/constants/mock-data';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { apiRequest } from '@/utils/api';

// Shape of the real POST /api/ai/ask response — see backend/src/controllers/aiController.js.
type AskResponse = {
  turnId: string;
  question: string;
  aiResponse: string;
  sources: { sourceId: string; sourceName: string; sourceUrl: string }[];
  createdAt: string;
};

const formatTime = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

/** The only pre-filled message: Mira saying hello. Nothing here pretends the user already asked anything. */
const welcomeMessage = (): ChatMessage => ({
  id: 'welcome',
  from: 'mira',
  text: "Hi! I'm Mira. I'm here to answer any period or body questions — no question is too weird!",
  time: formatTime(),
});

export default function AssistantScreen() {
  const { markFirstQuestionAsked } = useAppState();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [welcomeMessage()]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const nextId = useRef(1);
  const insets = useSafeAreaInsets();

  // The chat is an inverted list (newest at the bottom, always anchored there), so a new message
  // needs no scroll-to-end bookkeeping and a short chat sits right above the input instead of
  // leaving a dead gap. The input row follows the keyboard with Reanimated's keyboard tracking,
  // which works the same on iOS and on Android's edge-to-edge window — no KeyboardAvoidingView.
  // While the keyboard is closed, the row sits above the floating tab bar (see screen-container.tsx's
  // `tabBar` prop for why it has to clear the bar's own touchable area, not just its visuals).
  const keyboard = useAnimatedKeyboard();
  const inputRowStyle = useAnimatedStyle(() => ({
    paddingBottom: Math.max(TAB_BAR_CLEARANCE, keyboard.height.value + Spacing.md),
  }));

  // Newest first, because the list is inverted.
  const data = useMemo(() => [...messages].reverse(), [messages]);
  const hasAsked = messages.some((m) => m.from === 'user');

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;

    const userMessage: ChatMessage = { id: `m${nextId.current++}`, from: 'user', text: trimmed, time: formatTime() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    markFirstQuestionAsked();
    setTyping(true);

    try {
      // The real pipeline: safety check → retrieval → grounded generation (or an honest
      // "I don't know"/safety disclaimer) — see backend/src/controllers/aiController.js.
      // `quiet: true` since a failure here is expected and handled right below, not a bug
      // worth popping LogBox's red-screen overlay over.
      const data = await apiRequest<AskResponse>('/ai/ask', {
        method: 'POST',
        body: { question: trimmed },
        quiet: true,
      });
      const reply: ChatMessage = {
        id: `m${nextId.current++}`,
        from: 'mira',
        text: data.aiResponse,
        time: formatTime(),
        sources: data.sources,
      };
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      // A real network call can genuinely fail (no connection, session expired, server error) —
      // surfaced as a normal-looking Mira message rather than crashing the screen.
      const reply: ChatMessage = {
        id: `m${nextId.current++}`,
        from: 'mira',
        text:
          err instanceof Error
            ? `Sorry, I couldn't get an answer just now — ${err.message}`
            : "Sorry, I couldn't get an answer just now. Please try again in a moment.",
        time: formatTime(),
      };
      setMessages((prev) => [...prev, reply]);
    } finally {
      setTyping(false);
    }
  };

  const canSend = input.trim().length > 0 && !typing;

  return (
    <View style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <MascotMini size={36} />
        <View>
          <AppText variant="h3">Mira AI</AppText>
          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <AppText variant="small">Always here for you</AppText>
          </View>
        </View>
      </View>

      <FlatList
        style={styles.flex}
        data={data}
        inverted
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <ChatBubble message={item} />}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        // In an inverted list the header renders at the bottom (under the newest message) and the
        // footer at the top (above the oldest).
        ListHeaderComponent={
          typing ? (
            <Animated.View entering={FadeIn.duration(200)} style={styles.typingRow}>
              <View style={styles.avatar}>
                <MascotMini size={26} />
              </View>
              <View style={styles.typingBubble}>
                <TypingDots />
              </View>
            </Animated.View>
          ) : null
        }
        ListFooterComponent={
          hasAsked ? null : (
            <View style={styles.hero}>
              <Mascot size={96} waving={false} />
              <AppText variant="small" center style={styles.heroText}>
                Ask me anything about periods, cycles or how your body feels.
              </AppText>
            </View>
          )
        }
      />

      {!hasAsked && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.suggestionsScroll}
          contentContainerStyle={styles.suggestionsRow}>
          {chatSuggestions.map((s) => (
            <Chip key={s} label={s} onPress={() => send(s)} style={styles.suggestionChip} />
          ))}
        </ScrollView>
      )}

      <Animated.View style={[styles.inputRow, inputRowStyle]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask Mira anything..."
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
          multiline
        />
        <Pressable
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          onPress={() => send(input)}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send">
          <Ionicons name="send" size={17} color={Colors.textOnPrimary} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  messagesContent: { paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.lg },
  hero: { alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.xl, paddingBottom: Spacing.xl },
  heroText: { maxWidth: 260, color: Colors.textSecondary },
  typingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, marginBottom: Spacing.lg },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.tint50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingBubble: { backgroundColor: Colors.surfaceAlt, borderRadius: Radius.lg, borderBottomLeftRadius: 4, paddingHorizontal: Spacing.sm },
  // Explicit, bounded height on the ScrollView itself — a quick-reply strip is one short row,
  // never something that can stretch to fill whatever space is left above the input.
  suggestionsScroll: { flexGrow: 0, height: 44, marginBottom: Spacing.md },
  suggestionsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xxl },
  // Lighter than the standard Chip used for the Symptoms/Mood/Flow pickers — a one-tap
  // "try asking this" nudge, like Messenger/ChatGPT's quick-reply pills.
  suggestionChip: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    color: Colors.text,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.4 },
});
