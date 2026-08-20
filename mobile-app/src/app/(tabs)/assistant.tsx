import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/mira/app-text';
import { TAB_BAR_CLEARANCE } from '@/components/mira/bottom-nav';
import { ChatBubble } from '@/components/mira/chat-bubble';
import { Chip } from '@/components/mira/chip';
import { MascotMini } from '@/components/mira/mascot';
import { TypingDots } from '@/components/mira/typing-dots';
import { ChatMessage, chatSuggestions, initialChat } from '@/constants/mock-data';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';

const REPLIES: Record<string, string> = {
  'Why do I get cramps?':
    'Cramps happen when your uterus contracts to shed its lining. A warm compress and gentle movement can really help!',
  'Is my flow normal?':
    'Flow varies a lot from person to person — anywhere from light spotting to needing a change every few hours can be normal. If it ever feels unusually heavy, it is worth mentioning to a trusted adult.',
  'How do I use a tampon?':
    'Totally okay to feel nervous about this one! Start by relaxing, use a slim/light tampon, and take your time — Mira has a full guide in the Education tab if you want step-by-step pictures.',
  'Why am I moody today?':
    'Hormone shifts before your period (PMS) can absolutely affect mood — you are not overreacting, it is biology! Being gentle with yourself helps.',
};

function generateReply(text: string): string {
  return (
    REPLIES[text] ??
    "That's a great question! While I'm just a prototype right now, in the full version I'll give you a caring, science-based answer tailored to your cycle."
  );
}

let messageId = initialChat.length + 1;

export default function AssistantScreen() {
  const { markFirstQuestionAsked } = useAppState();
  const [messages, setMessages] = useState<ChatMessage[]>(initialChat);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  // This is a real tab screen (Tabs renders BottomNav as a floating overlay on top of it, not a
  // pushed screen without one), so unlike record.tsx/checkin.tsx/prediction.tsx the input row
  // has to actively clear the tab bar's own touchable rect — otherwise it sits underneath it and
  // taps on it never reach the TextInput at all (not just visually covered, unreachable). Only
  // needed while the keyboard is closed: once it's up, KeyboardAvoidingView already pads this
  // whole column above the (much taller) keyboard, so the tab bar's gone from under it anyway.
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToEnd = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: `m${messageId++}`,
      from: 'user',
      text: trimmed,
      time: 'Now',
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    scrollToEnd();
    markFirstQuestionAsked();

    setTyping(true);
    scrollToEnd();
    setTimeout(() => {
      const reply: ChatMessage = {
        id: `m${messageId++}`,
        from: 'mira',
        text: generateReply(trimmed),
        time: 'Now',
      };
      setTyping(false);
      setMessages((prev) => [...prev, reply]);
      scrollToEnd();
    }, 1400);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + 10}>
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

      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToEnd}>
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} />
        ))}
        {typing && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.typingRow}>
            <View style={styles.avatar}>
              <MascotMini size={26} />
            </View>
            <View style={styles.typingBubble}>
              <TypingDots />
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {messages.length <= initialChat.length && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsScroll}
          contentContainerStyle={styles.suggestionsRow}>
          {chatSuggestions.map((s) => (
            <Chip key={s} label={s} onPress={() => send(s)} style={styles.suggestionChip} />
          ))}
        </ScrollView>
      )}

      <View
        style={[
          styles.inputRow,
          { paddingBottom: keyboardVisible ? Math.max(insets.bottom, Spacing.md) : TAB_BAR_CLEARANCE },
        ]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask Mira anything..."
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
          multiline
          onSubmitEditing={() => send(input)}
        />
        <Pressable
          style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
          onPress={() => send(input)}
          disabled={!input.trim()}>
          <Ionicons name="send" size={17} color={Colors.textOnPrimary} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
  messagesContent: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
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
  // Explicit, bounded height on the ScrollView itself (not just its content) — a normal chatbot's
  // quick-reply strip is one short row, never something that can stretch to fill whatever space
  // happens to be left above the input. alignItems: 'center' on the row is the same guarantee
  // from the other axis, so a chip can never get pulled taller than its own content either way.
  suggestionsScroll: { height: 44, marginBottom: Spacing.md },
  suggestionsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xxl },
  // Smaller than the standard Chip footprint used for Symptoms/Mood/Flow pickers elsewhere —
  // those are deliberate multi-select form fields; a chat suggestion is a lighter, one-tap
  // "try asking this" nudge, so it reads more like Messenger/ChatGPT's quick-reply pills.
  suggestionChip: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.sm,
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
