import { useMemo } from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";
import type { AppScheme, ChipStyle } from "@/constants/colors";

interface Props {
  expression: string;
  situationLabel: string;
  explanation: string;
  badgeStyle: ChipStyle;
  scheme: AppScheme;
  onPress: () => void;
  copied: boolean;
}

export default function ExpressionCard({
  expression,
  situationLabel,
  explanation,
  badgeStyle,
  scheme,
  onPress,
  copied,
}: Props) {
  const c = Colors[scheme];
  const s = useMemo(() => makeStyles(c), [scheme]);

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.75}>
      <View style={s.topRow}>
        <View style={[s.badge, { backgroundColor: badgeStyle.bg }]}>
          <Text style={[s.badgeText, { color: badgeStyle.text }]}>{situationLabel}</Text>
        </View>
        <Text style={[s.copyHint, { color: c.textSecondary }]}>
          {copied ? "Copied" : "Tap to copy"}
        </Text>
      </View>
      <Text style={[s.expression, { color: c.textPrimary }]}>{expression}</Text>
      <Text style={[s.explanation, { color: c.textSecondary }]}>{explanation}</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (c: typeof Colors.light) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      padding: 18,
      gap: 10,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    badgeText: { fontSize: 14, fontWeight: "600" },
    copyHint: { fontSize: 14 },
    expression: { fontSize: 22, fontWeight: "700", lineHeight: 28, letterSpacing: -0.2 },
    explanation: { fontSize: 14, lineHeight: 20 },
  });
