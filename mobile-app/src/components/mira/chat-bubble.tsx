import { Linking, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { AppText } from '@/components/mira/app-text';
import { MascotMini } from '@/components/mira/mascot';
import { ChatMessage } from '@/constants/mock-data';
import { Colors, Radius, Spacing } from '@/constants/theme';

export function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.from === 'user';

  return (
    <Animated.View
      entering={FadeInUp.duration(300).springify().damping(18)}
      style={[styles.row, isUser && styles.rowUser]}>
      {!isUser && (
        <View style={styles.avatar}>
          <MascotMini size={26} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.miraBubble]}>
        <AppText variant="body" color={isUser ? Colors.textOnPrimary : Colors.text} style={styles.text}>
          {message.text}
        </AppText>

        {/* Only ever present on a real, grounded Mira answer — never on the blocked/"don't know"
            replies, since those never actually retrieved anything to cite. This is the one visible
            payoff of the whole RAG pipeline: proof an answer came from somewhere real. */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <View style={styles.sourcesRow}>
            {message.sources.map((s) => (
              <Pressable
                key={s.sourceId}
                onPress={() => Linking.openURL(s.sourceUrl)}
                style={styles.sourceChip}
                hitSlop={4}>
                <AppText variant="caption" color={Colors.primary}>
                  {s.sourceName}
                </AppText>
              </Pressable>
            ))}
          </View>
        )}

        <AppText variant="caption" color={isUser ? 'rgba(255,255,255,0.75)' : Colors.textMuted} style={styles.time}>
          {message.time}
        </AppText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, marginBottom: Spacing.lg, maxWidth: '88%' },
  rowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.tint50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: { borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  miraBubble: { backgroundColor: Colors.surfaceAlt, borderBottomLeftRadius: 4 },
  userBubble: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  text: { lineHeight: 21 },
  sourcesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.sm },
  sourceChip: {
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.tint200,
    backgroundColor: Colors.tint50,
  },
  time: { marginTop: Spacing.xs, textAlign: 'right' },
});
