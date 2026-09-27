import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated as RNAnimated, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';

import { AppText } from '@/components/mira/app-text';
import { Button } from '@/components/mira/button';
import { FlipCard } from '@/components/mira/education/flip-card';
import { HeartBurst, useMira } from '@/components/mira/education/mira-companion';
import { MYTH_DECK } from '@/constants/education-activities';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';

type Guess = 'myth' | 'fact';

const SWIPE = 90;
const CARD_HEIGHT = 420;

/**
 * Topic 5: a swipeable myth-busting stack. Swipe left for "Myth" or right for "Fact" (or tap the
 * buttons); the card then flips in 3D to show the truth, and hearts fly up when you are right.
 */
export function MythStack() {
  const say = useMira();
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState<Guess | null>(null);
  const [score, setScore] = useState(0);
  const [burst, setBurst] = useState(0);
  const [round, setRound] = useState(0);

  const card = MYTH_DECK[index];
  const finished = index >= MYTH_DECK.length;
  const answered = guess !== null;

  const answer = (g: Guess) => {
    if (answered || !card) return;
    setGuess(g);
    const correct = (g === 'myth') === card.isMyth;
    if (correct) {
      setScore((s) => s + 1);
      setBurst((n) => n + 1);
      say(card.isMyth ? 'Myth busted! Great instincts.' : 'Yes, that one is a fact!', 'cheer');
    } else {
      say('Not quite, and that is okay. Now you know!');
    }
  };

  const next = () => {
    setGuess(null);
    setIndex((i) => i + 1);
  };

  const restart = () => {
    setIndex(0);
    setGuess(null);
    setScore(0);
    setRound((r) => r + 1);
    say('Round two! Let us see how you do.');
  };

  if (finished) {
    return (
      <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.finish}>
        <Ionicons name="trophy" size={44} color={Colors.warning} />
        <AppText variant="h1" center>
          {score} of {MYTH_DECK.length}
        </AppText>
        <AppText variant="bodyLarge" center>
          {score === MYTH_DECK.length ? 'You spotted every myth and fact!' : 'Nice work. Every card taught you something new.'}
        </AppText>
        <Button label="Play again" onPress={restart} />
      </Animated.View>
    );
  }

  return (
    <View key={round}>
      <View style={styles.scoreRow}>
        <AppText variant="bodyMedium">
          Card {index + 1} of {MYTH_DECK.length}
        </AppText>
        <View style={styles.scorePill}>
          <Ionicons name="sparkles" size={14} color={Colors.primary} />
          <AppText variant="caption" color={Colors.primary}>
            {score} correct
          </AppText>
        </View>
      </View>

      <View style={styles.stackArea}>
        {/* two cards peeking out from underneath */}
        {MYTH_DECK.length - index > 2 ? <View style={[styles.peek, styles.peekTwo]} /> : null}
        {MYTH_DECK.length - index > 1 ? <View style={[styles.peek, styles.peekOne]} /> : null}

        <TopCard key={index} card={card} guess={guess} onSwipe={answer} />
        <HeartBurst trigger={burst} />
      </View>

      {answered ? (
        <Animated.View entering={FadeInUp.springify().damping(16)}>
          <Button label={index === MYTH_DECK.length - 1 ? 'See my score' : 'Next card'} onPress={next} />
        </Animated.View>
      ) : (
        <View style={styles.buttons}>
          <Pressable onPress={() => answer('myth')} accessibilityRole="button" style={[styles.answerButton, { backgroundColor: Colors.tint100 }]}>
            <Ionicons name="arrow-back" size={18} color={Colors.primary} />
            <AppText variant="button" color={Colors.primary}>
              Myth
            </AppText>
          </Pressable>
          <Pressable onPress={() => answer('fact')} accessibilityRole="button" style={[styles.answerButton, { backgroundColor: Colors.successTint }]}>
            <AppText variant="button" color={Colors.success}>
              Fact
            </AppText>
            <Ionicons name="arrow-forward" size={18} color={Colors.success} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

type TopCardProps = { card: (typeof MYTH_DECK)[number]; guess: Guess | null; onSwipe: (g: Guess) => void };

function TopCard({ card, guess, onSwipe }: TopCardProps) {
  const [pan] = useState(() => new RNAnimated.ValueXY());
  const answeredRef = useRef(false);
  const onSwipeRef = useRef(onSwipe);
  // PanResponder is created once, so it reads the latest callback / answered state through refs.
  useEffect(() => {
    onSwipeRef.current = onSwipe;
    answeredRef.current = guess !== null;
  }, [onSwipe, guess]);

  // The handlers below only run on touch events, never during render — the refs they read are safe here.
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() =>
    PanResponder.create({
      // Only claim clearly horizontal drags so the page can still scroll vertically.
      onMoveShouldSetPanResponder: (_, g) => !answeredRef.current && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: RNAnimated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        RNAnimated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 6, useNativeDriver: false }).start();
        if (g.dx > SWIPE) onSwipeRef.current('fact');
        else if (g.dx < -SWIPE) onSwipeRef.current('myth');
      },
    }),
  );

  const rotate = pan.x.interpolate({ inputRange: [-200, 0, 200], outputRange: ['-10deg', '0deg', '10deg'] });
  const mythOpacity = pan.x.interpolate({ inputRange: [-SWIPE, -20, 0], outputRange: [1, 0.2, 0], extrapolate: 'clamp' });
  const factOpacity = pan.x.interpolate({ inputRange: [0, 20, SWIPE], outputRange: [0, 0.2, 1], extrapolate: 'clamp' });

  const answered = guess !== null;
  const correct = answered && (guess === 'myth') === card.isMyth;

  return (
    <RNAnimated.View style={{ transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] }} {...responder.panHandlers}>
      <FlipCard
        height={CARD_HEIGHT}
        flipped={answered}
        onFlip={() => {}}
        frontColor={Colors.surface}
        backColor={correct ? Colors.successTint : Colors.tint50}
        accent={answered ? (correct ? Colors.success : Colors.primary) : Colors.tint200}
        backLabel={correct ? 'You got it right!' : 'Now you know!'}
        front={
          <>
            <View style={styles.hintRow}>
              <AppText variant="caption">MYTH OR FACT?</AppText>
            </View>
            <AppText variant="h2" center style={styles.statement}>
              {card.statement}
            </AppText>
            <AppText variant="small" center>
              Swipe left for Myth, right for Fact
            </AppText>
            <RNAnimated.View style={[styles.stamp, styles.stampMyth, { opacity: mythOpacity }]} pointerEvents="none">
              <AppText variant="h3" color={Colors.primary}>
                MYTH
              </AppText>
            </RNAnimated.View>
            <RNAnimated.View style={[styles.stamp, styles.stampFact, { opacity: factOpacity }]} pointerEvents="none">
              <AppText variant="h3" color={Colors.success}>
                FACT
              </AppText>
            </RNAnimated.View>
          </>
        }
        back={
          <>
            <View style={styles.verdict}>
              <Ionicons name={correct ? 'checkmark-circle' : 'close-circle'} size={22} color={correct ? Colors.success : Colors.primary} />
              <AppText variant="h3" color={correct ? Colors.success : Colors.primary}>
                {correct ? 'Correct!' : 'Not quite'} That is {card.isMyth ? 'a myth' : 'a fact'}.
              </AppText>
            </View>
            {card.isMyth ? null : (
              <AppText variant="small">The myth it busts: {card.myth}</AppText>
            )}
            <AppText variant="body" style={styles.explanation}>
              {card.explanation}
            </AppText>
          </>
        }
      />
    </RNAnimated.View>
  );
}

const styles = StyleSheet.create({
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  scorePill: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.tint50, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 1 },
  stackArea: { marginBottom: Spacing.lg, paddingBottom: Spacing.md },
  peek: { position: 'absolute', left: 0, right: 0, height: CARD_HEIGHT, borderRadius: Radius.xl, backgroundColor: Colors.tint100 },
  peekOne: { top: 10, transform: [{ scale: 0.96 }] },
  peekTwo: { top: 20, transform: [{ scale: 0.92 }], backgroundColor: Colors.tint50 },
  hintRow: { position: 'absolute', top: Spacing.lg },
  statement: { lineHeight: 30 },
  stamp: { position: 'absolute', top: Spacing.xl, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.md, borderWidth: 2 },
  stampMyth: { left: Spacing.lg, borderColor: Colors.primary, transform: [{ rotate: '-12deg' }] },
  stampFact: { right: Spacing.lg, borderColor: Colors.success, transform: [{ rotate: '12deg' }] },
  verdict: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  explanation: { lineHeight: 23 },
  buttons: { flexDirection: 'row', gap: Spacing.md },
  answerButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg, borderRadius: Radius.pill },
  finish: { alignItems: 'center', gap: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xxl, ...Shadow.card },
});
