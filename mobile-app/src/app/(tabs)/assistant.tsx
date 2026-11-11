import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/yumi/app-text';
import { TAB_BAR_CLEARANCE } from '@/components/yumi/bottom-nav';
import { ChatBubble } from '@/components/yumi/chat-bubble';
import { Chip } from '@/components/yumi/chip';
import { Mascot, MascotMini } from '@/components/yumi/mascot';
import { TypingDots } from '@/components/yumi/typing-dots';
import { ChatMessage } from '@/constants/mock-data';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { useLocalizedTextStyle } from '@/i18n/fonts';
import { formatTime } from '@/utils/date';
import { ApiError, apiRequest } from '@/utils/api';

// Shape of the real POST /api/ai/ask response — see backend/src/controllers/aiController.js.
type AskResponse = {
  turnId: string;
  question: string;
  aiResponse: string;
  sources: { sourceId: string; sourceName: string; sourceUrl: string }[];
  createdAt: string;
};

const now = () => formatTime(new Date());

const CHAT_SUGGESTION_KEYS = [
  'assistant.suggestions.flow',
  'assistant.suggestions.cramps',
  'assistant.suggestions.tampon',
  'assistant.suggestions.moody',
] as const;

/** The only pre-filled message: Yumi saying hello. Nothing here pretends the user already asked anything. */
const welcomeMessage = (): ChatMessage => ({
  id: 'welcome',
  from: 'yumi',
  text: '',
  time: now(),
});

export default function AssistantScreen() {
  const { markFirstQuestionAsked } = useAppState();
  const { t, i18n } = useTranslation();
  const inputStyle = useLocalizedTextStyle(styles.input);
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

    const userMessage: ChatMessage = { id: `m${nextId.current++}`, from: 'user', text: trimmed, time: now() };
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
        // The app's language, so Yumi answers in it (a Khmer-script question is always answered
        // in Khmer regardless — see backend/src/utils/language.js).
        body: { question: trimmed, language: i18n.language === 'km' ? 'km' : 'en' },
        quiet: true,
      });
      const reply: ChatMessage = {
        id: `m${nextId.current++}`,
        from: 'yumi',
        text: data.aiResponse,
        time: now(),
        sources: data.sources,
      };
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      // A real network call can genuinely fail (no connection, session expired, server error) —
      // surfaced as a normal-looking Yumi message rather than crashing the screen.
      const reply: ChatMessage = {
        id: `m${nextId.current++}`,
        from: 'yumi',
        // AI_UNAVAILABLE (Gemini down/rate-limited) comes with an English server message, so it's
        // shown from the app's own translation instead.
        text:
          err instanceof ApiError && err.code === 'AI_UNAVAILABLE'
            ? t('assistant.unavailable')
            : err instanceof Error
              ? t('assistant.errorWithReason', { reason: err.message })
              : t('assistant.error'),
        time: now(),
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
          <AppText variant="h3">{t('tabs.assistant')}</AppText>
          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <AppText variant="small">{t('assistant.status')}</AppText>
          </View>
        </View>
      </View>

      <FlatList
        style={styles.flex}
        data={data}
        inverted
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <ChatBubble message={item.id === 'welcome' ? { ...item, text: t('assistant.welcome') } : item} />
        )}
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
          ) : undefined
        }
        ListFooterComponent={
          hasAsked ? undefined : (
            <View style={styles.hero}>
              <Mascot size={96} waving={false} />
              <AppText variant="small" center style={styles.heroText}>
                {t('assistant.hero')}
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
          {CHAT_SUGGESTION_KEYS.map((key) => (
            <Chip key={key} label={t(key)} onPress={() => send(t(key))} style={styles.suggestionChip} />
          ))}
        </ScrollView>
      )}

      <Animated.View style={[styles.inputRow, inputRowStyle]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={t('assistant.placeholder')}
          placeholderTextColor={Colors.textMuted}
          style={inputStyle}
          multiline
        />
        <Pressable
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          onPress={() => send(input)}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel={t('assistant.send')}>
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
