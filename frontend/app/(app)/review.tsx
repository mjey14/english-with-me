import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useRef } from "react";

import ScreenLayout from "@/components/ScreenLayout";
import { Colors, getPaletteStyle, getPresetStyle, getChipStyle } from "@/constants/colors";
import { useAppTheme } from "@/contexts/ThemeContext";
import { PRESETS } from "@/constants/presets";
import { api } from "@/services/api";

interface Output {
  expression: string;
  situation_label: string;
  explanation: string;
}

interface ReviewItem {
  id: string;
  source: "convert" | "learn";
  category: string;
  sub_category: string | null;
  korean_input: string | null;
  outputs: Output[];
}

function getCategoryLabel(category: string) {
  return PRESETS.find((p) => p.id === category)?.label ?? category;
}

function getSubLabel(category: string, sub_category: string | null): string {
  if (!sub_category) return "";
  const preset = PRESETS.find((p) => p.id === category);
  return preset?.subCategories.find((s) => s.key === sub_category)?.label ?? sub_category;
}

export default function ReviewScreen() {
  const { scheme } = useAppTheme();
  const c = Colors[scheme];
  const s = useMemo(() => makeStyles(c), [scheme]);

  const [items, setItems] = useState<ReviewItem[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [badgeOffset, setBadgeOffset] = useState(() => Math.floor(Math.random() * 7));

  const flipAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getReviewItems();
      // Flatten learn items: one card per output (korean_equivalent as front prompt)
      const flattened: ReviewItem[] = data.flatMap((item: ReviewItem) => {
        if (item.source === "learn") {
          return item.outputs.map((out: any) => ({
            ...item,
            korean_input: out.korean_equivalent || out.situation_label,
            outputs: [out],
          }));
        }
        return [item];
      });
      const shuffled = [...flattened].sort(() => Math.random() - 0.5);
      setItems(shuffled);
      setIndex(0);
      setRevealed(false);
      setDone(flattened.length === 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const current = items[index];

  const handleReveal = () => {
    setRevealed(true);
    Animated.timing(flipAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const advance = (dismiss: boolean) => {
    if (dismiss && current) {
      api.dismissReviewItem(current.id).catch(() => {});
      setItems((prev) => prev.filter((_, i) => i !== index));
    } else {
      const nextIndex = index + 1;
      if (nextIndex >= items.length) {
        setDone(true);
      } else {
        setIndex(nextIndex);
      }
    }
    setRevealed(false);
    flipAnim.setValue(0);
    setBadgeOffset(Math.floor(Math.random() * 7));

    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -20, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    if (!loading && items.length > 0 && index >= items.length) {
      setDone(true);
    }
  }, [items, index, loading]);

  const explanationOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  if (loading) {
    return (
      <ScreenLayout title="Quiz myself">
        <ActivityIndicator color={c.textSecondary} style={{ marginTop: 40 }} />
      </ScreenLayout>
    );
  }

  if (done || !current) {
    return (
      <ScreenLayout title="Quiz myself">
        <View style={s.emptyState}>
          <Text style={[s.emptyTitle, { color: c.textPrimary }]}>
            {items.length === 0 ? "Nothing to review yet." : "You're all caught up!"}
          </Text>
          <Text style={[s.emptyHint, { color: c.textSecondary }]}>
            {items.length === 0
              ? "Convert or learn some expressions and they'll appear here."
              : "Come back after more conversions, or review again from the start."}
          </Text>
          {items.length > 0 && (
            <TouchableOpacity style={[s.button, { marginTop: 24 }]} onPress={() => { setIndex(0); setDone(false); setRevealed(false); }}>
              <Text style={s.buttonText}>Start over</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScreenLayout>
    );
  }

  const catLabel = getCategoryLabel(current.category);
  const subLabel = getSubLabel(current.category, current.sub_category);
  const catStyle = getPresetStyle(current.category, scheme);
  const progress = `${index + 1} / ${items.length}`;
  const isLearn = current.source === "learn";

  return (
    <ScreenLayout title="Quiz myself">
      <View style={s.container}>

        {/* Progress */}
        <Text style={[s.progress, { color: c.textSecondary }]}>{progress}</Text>

        {/* Card */}
        <Animated.View style={[s.card, { transform: [{ translateY: slideAnim }] }]}>
          {/* Category + source badges */}
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
            <View style={[s.badge, { backgroundColor: catStyle.bg }]}>
              <Text style={[s.badgeText, { color: catStyle.text }]}>{catLabel}</Text>
            </View>
            {subLabel ? (
              <View style={[s.badge, { backgroundColor: getChipStyle(current.sub_category!, scheme).bg }]}>
                <Text style={[s.badgeText, { color: getChipStyle(current.sub_category!, scheme).text }]}>{subLabel}</Text>
              </View>
            ) : null}
            {isLearn && (
              <View style={[s.badge, { backgroundColor: getPaletteStyle(2, scheme).bg }]}>
                <Text style={[s.badgeText, { color: getPaletteStyle(2, scheme).text }]}>Learn</Text>
              </View>
            )}
          </View>

          {/* Prompt: Korean input (convert) or situation_label (learn) */}
          <Text style={[s.korean, { color: c.textPrimary }]}>
            {current.korean_input}
          </Text>

          {/* Hidden / Revealed */}
          {!revealed ? (
            <TouchableOpacity style={s.revealBtn} onPress={handleReveal} activeOpacity={0.7}>
              <Text style={[s.revealText, { color: c.textSecondary }]}>Tap to reveal</Text>
            </TouchableOpacity>
          ) : (
            <Animated.View style={[s.outputsWrapper, { opacity: explanationOpacity }]}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.outputs}>
                {current.outputs.map((out, idx) => {
                  const badgeStyle = getPaletteStyle((idx + badgeOffset) % 7, scheme);
                  return (
                    <View key={idx} style={[s.outputItem, { borderColor: c.border }]}>
                      <View style={[s.labelBadge, { backgroundColor: badgeStyle.bg }]}>
                        <Text style={[s.labelText, { color: badgeStyle.text }]}>{out.situation_label}</Text>
                      </View>
                      <Text style={[s.expression, { color: c.textPrimary }]}>{out.expression}</Text>
                      <Text style={[s.explanation, { color: c.textSecondary }]}>{out.explanation}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            </Animated.View>
          )}
        </Animated.View>

        {/* Action buttons — only visible after reveal */}
        {revealed && (
          <View style={s.actions}>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: c.surface, borderColor: c.border }]}
              onPress={() => advance(false)}
            >
              <Text style={[s.actionText, { color: c.textPrimary }]}>Practice more</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: c.buttonBg }]}
              onPress={() => advance(true)}
            >
              <Text style={[s.actionText, { color: c.buttonText }]}>Don't show again</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    </ScreenLayout>
  );
}

const makeStyles = (c: typeof Colors.light) =>
  StyleSheet.create({
    container: { flex: 1, padding: 20 },
    progress: { fontSize: 14, textAlign: "right", marginBottom: 16 },
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 20,
      gap: 16,
      flex: 1,
    },
    badge: {
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    badgeText: { fontSize: 14, fontWeight: "600" },
    korean: { fontSize: 22, fontWeight: "700", lineHeight: 30 },
    revealBtn: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      borderStyle: "dashed",
      minHeight: 80,
    },
    revealText: { fontSize: 18, fontWeight: "500" },
    outputsWrapper: { flex: 1 },
    outputs: { gap: 12, paddingBottom: 4 },
    outputItem: {
      borderTopWidth: 1,
      paddingTop: 12,
      gap: 8,
    },
    labelBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    labelText: { fontSize: 14, fontWeight: "600" },
    expression: { fontSize: 22, fontWeight: "700", lineHeight: 28, letterSpacing: -0.2 },
    explanation: { fontSize: 14, lineHeight: 20, color: c.textSecondary },
    actions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 16,
    },
    actionBtn: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "transparent",
    },
    actionText: { fontSize: 18, fontWeight: "600" },
    emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 8 },
    emptyTitle: { fontSize: 18, fontWeight: "500" },
    emptyHint: { fontSize: 14, textAlign: "center", lineHeight: 20 },
    button: {
      backgroundColor: c.buttonBg,
      borderRadius: 12,
      paddingVertical: 15,
      paddingHorizontal: 32,
      alignItems: "center",
    },
    buttonText: { color: c.buttonText, fontSize: 18, fontWeight: "600" },
  });
