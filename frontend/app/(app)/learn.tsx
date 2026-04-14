import { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Keyboard,
} from "react-native";

import { useRef } from "react";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import ScreenLayout from "@/components/ScreenLayout";
import ExpressionCard from "@/components/ExpressionCard";
import { Colors, getChipStyle, getPaletteStyle, getPresetStyle } from "@/constants/colors";
import { useAppTheme } from "@/contexts/ThemeContext";
import { useUser } from "@/contexts/UserContext";
import { PRESETS, DEFAULT_ENABLED } from "@/constants/presets";
import { api } from "@/services/api";

interface Expression {
  expression: string;
  situation_label: string;
  explanation: string;
}

export default function LearnScreen() {
  const { scheme } = useAppTheme();
  const { enabledModes } = useUser();
  const c = Colors[scheme];
  const s = useMemo(() => makeStyles(c), [scheme]);

  const [selectedCategory, setSelectedCategory] = useState("work");
  const [selectedSub, setSelectedSub] = useState<string | null>("meeting");
  const [expressions, setExpressions] = useState<Expression[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [scrollAtBottom, setScrollAtBottom] = useState(true);
  const [details, setDetails] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!enabledModes.includes(selectedCategory)) {
      const first = PRESETS.find((p) => enabledModes.includes(p.id));
      if (first) {
        setSelectedCategory(first.id);
        setSelectedSub(first.subCategories[0]?.key ?? null);
      }
    }
  }, [enabledModes]);

  const enabledPresets = PRESETS.filter((p) => enabledModes.includes(p.id));
  const activePreset = enabledPresets.find((p) => p.id === selectedCategory);
  const subCategories = activePreset?.subCategories ?? [];

  const handleSelectCategory = (id: string) => {
    setSelectedCategory(id);
    const preset = PRESETS.find((p) => p.id === id);
    setSelectedSub(preset?.subCategories[0]?.key ?? null);
    setExpressions([]);
    setError(null);
    setDetails("");
    setShowDetails(false);
  };

  const handleGenerate = useCallback(async () => {
    Keyboard.dismiss();
    setLoading(true);
    setError(null);
    setExpressions([]);
    try {
      const data = await api.getLearnExpressions(selectedCategory, selectedSub, details.trim() || undefined);
      setExpressions(data.expressions);
      setScrollAtBottom(false);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start();
    } catch {
      setError("Could not load expressions. Try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedSub, details]);

  const handleCopy = async (text: string, idx: number) => {
    await Clipboard.setStringAsync(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <ScreenLayout title="Browse expressions">
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          onScroll={(e) => {
            const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
            setScrollAtBottom(contentOffset.y + layoutMeasurement.height >= contentSize.height - 4);
          }}
          scrollEventThrottle={16}
        >
          {/* Category chips */}
          <View style={s.section}>
            <Text style={[s.sectionLabel, { color: c.textSecondary }]}>Category</Text>
            <View style={s.chipRow}>
              {enabledPresets.map((preset) => {
                const active = selectedCategory === preset.id;
                const chipStyle = getPresetStyle(preset.id, scheme);
                return (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      s.chip,
                      { backgroundColor: chipStyle.bg, borderColor: chipStyle.text },
                      !active && { opacity: 0.45 },
                    ]}
                    onPress={() => handleSelectCategory(preset.id)}
                  >
                    <Text style={[s.chipText, { color: chipStyle.text }]}>{preset.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Sub-category chips */}
          {subCategories.length > 0 && (
            <View style={s.section}>
              <Text style={[s.sectionLabel, { color: c.textSecondary }]}>Context</Text>
              <View style={s.chipRow}>
                {subCategories.map((sub) => {
                  const active = selectedSub === sub.key;
                  const chipStyle = getChipStyle(sub.key, scheme);
                  return (
                    <TouchableOpacity
                      key={sub.key}
                      style={[
                        s.chip,
                        { backgroundColor: chipStyle.bg, borderColor: chipStyle.text },
                        !active && { opacity: 0.45 },
                      ]}
                      onPress={() => setSelectedSub(sub.key)}
                    >
                      <Text style={[s.chipText, { color: chipStyle.text }]}>{sub.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Details toggle */}
          <TouchableOpacity
            style={s.detailsToggle}
            onPress={() => setShowDetails(!showDetails)}
          >
            <Text style={[s.detailsToggleText, { color: c.textSecondary }]}>
              {showDetails ? "Hide details" : "+ Add details (optional)"}
            </Text>
          </TouchableOpacity>

          {showDetails && (
            <TextInput
              key={`details-${scheme}`}
              style={[s.detailsInput, { color: c.textPrimary }]}
              value={details}
              onChangeText={setDetails}
              placeholder="e.g. First time meeting this person, want to sound approachable."
              placeholderTextColor={c.textSecondary}
              multiline
              textAlignVertical="top"
            />
          )}

          <TouchableOpacity
            style={[s.button, loading && s.buttonDisabled]}
            onPress={handleGenerate}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={c.buttonText} />
              : <Text style={s.buttonText}>
                  {expressions.length > 0 ? "Refresh" : "Generate expressions"}
                </Text>
            }
          </TouchableOpacity>

          {error && <Text style={s.errorText}>{error}</Text>}

          {expressions.length > 0 && (
            <Animated.View style={[s.resultList, { opacity: fadeAnim }]}>
              {expressions.map((expr, idx) => {
                const badgeStyle = getPaletteStyle(idx, scheme);
                return (
                  <ExpressionCard
                    key={idx}
                    expression={expr.expression}
                    situationLabel={expr.situation_label}
                    explanation={expr.explanation}
                    badgeStyle={badgeStyle}
                    scheme={scheme}
                    onPress={() => handleCopy(expr.expression, idx)}
                    copied={copiedIdx === idx}
                  />
                );
              })}
            </Animated.View>
          )}
        </ScrollView>

        {!scrollAtBottom && (
          <LinearGradient
            colors={[`${c.background}00`, c.background]}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={s.scrollFadeBottom}
            pointerEvents="none"
          />
        )}
      </View>
    </ScreenLayout>
  );
}

const makeStyles = (c: typeof Colors.light) =>
  StyleSheet.create({
    scroll: { padding: 20, paddingBottom: 48 },
    section: { marginBottom: 16 },
    sectionLabel: {
      fontSize: 14,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 8,
    },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 14,
      borderWidth: 1,
    },
    chipText: { fontSize: 18, fontWeight: "500" },
    detailsToggle: { alignSelf: "flex-start", paddingTop: 0, paddingBottom: 8 },
    detailsToggleText: { fontSize: 14, fontWeight: "500" },
    detailsInput: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 18,
      lineHeight: 22,
      minHeight: 80,
      marginBottom: 8,
    },
    button: {
      backgroundColor: c.buttonBg,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: "center",
      marginTop: 8,
      marginBottom: 24,
    },
    buttonDisabled: { opacity: 0.4 },
    buttonText: { color: c.buttonText, fontSize: 18, fontWeight: "600" },
    errorText: { color: c.error, marginBottom: 16, fontSize: 14 },
    resultList: { gap: 10 },
    scrollFadeBottom: {
      position: "absolute", bottom: 0, left: 0, right: 0, height: 48,
    },
  });
