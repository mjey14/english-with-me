import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  Animated,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ScreenLayout from "./ScreenLayout";
import ExpressionCard from "./ExpressionCard";
import { Colors, getChipStyle, getPaletteStyle } from "@/constants/colors";
import { useAppTheme } from "@/contexts/ThemeContext";
import { api } from "@/services/api";

export interface SubCategory {
  key: string;
  label: string;
  mode: "speaking" | "messaging" | "email" | "writing";
}

interface Output {
  expression: string;
  situation_label: string;
  explanation: string;
}

interface Props {
  title: string;
  category: string;
  subCategories: SubCategory[];
}

const MODE_LABELS: Record<string, string> = {
  speaking: "Speaking",
  written: "Written",
};

export default function ConvertScreen({ title, category, subCategories }: Props) {
  const { scheme } = useAppTheme();
  const c = Colors[scheme];
  const s = useMemo(() => makeStyles(c), [scheme]);

  const grouped = [
    { mode: "speaking", items: subCategories.filter((s) => s.mode === "speaking") },
    { mode: "written",  items: subCategories.filter((s) => s.mode !== "speaking") },
  ].filter((g) => g.items.length > 0);

  const [chipAtEnd, setChipAtEnd] = useState<Record<string, boolean>>({});
  const [chipAtStart, setChipAtStart] = useState<Record<string, boolean>>({});

  const [selectedSub, setSelectedSub] = useState<string | null>(
    subCategories.length > 0 ? subCategories[0].key : null
  );

  useEffect(() => {
    AsyncStorage.getItem(`lastSub_${category}`).then((saved) => {
      if (saved && subCategories.some((s) => s.key === saved)) {
        setSelectedSub(saved);
      }
    });
  }, [category]);

  const handleSelectSub = useCallback((key: string) => {
    setSelectedSub(key);
    AsyncStorage.setItem(`lastSub_${category}`, key);
  }, [category]);
  const [input, setInput] = useState("");
  const [context, setContext] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [badgeOffset, setBadgeOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [scrollAtBottom, setScrollAtBottom] = useState(true);

  useEffect(() => {
    if (outputs.length > 0) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start();
      setScrollAtBottom(false);
    }
  }, [outputs.length]);

  const handleConvert = async () => {
    if (!input.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    setError(null);
    setOutputs([]);
    try {
      const data = await api.convert(input.trim(), category, selectedSub, context.trim() || undefined);
      setOutputs(data.outputs);
      setBadgeOffset(Math.floor(Math.random() * 7));
    } catch (err: any) {
      if (err instanceof TypeError || err?.message === "Failed to fetch") {
        setError("Could not reach the server. Check your connection.");
      } else {
        setError("The conversion failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, idx: number) => {
    await Clipboard.setStringAsync(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <ScreenLayout title={title}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
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

          {/* Sub-category groups — compact rows */}
          {grouped.length > 0 && (
            <View style={s.chipSection}>
              {grouped.map(({ mode, items }) => (
                <View key={mode} style={s.chipGroupRow}>
                  <Text style={[s.chipGroupLabel, { color: c.textSecondary }]}>
                    {MODE_LABELS[mode]}
                  </Text>
                  <View style={{ position: "relative" }}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.chipRow}
                    onScroll={(e) => {
                      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
                      const atEnd = contentOffset.x + layoutMeasurement.width >= contentSize.width - 4;
                      const atStart = contentOffset.x <= 4;
                      setChipAtEnd((prev) => ({ ...prev, [mode]: atEnd }));
                      setChipAtStart((prev) => ({ ...prev, [mode]: atStart }));
                    }}
                    onContentSizeChange={(w, _) => {
                      // hide fade if content fits without scrolling
                    }}
                    scrollEventThrottle={16}
                  >
                    {items.map((sub) => {
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
                          onPress={() => handleSelectSub(sub.key)}
                        >
                          <Text style={[s.chipText, { color: chipStyle.text }]}>
                            {sub.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  {chipAtStart[mode] === false && (
                    <LinearGradient
                      colors={[c.background, `${c.background}00`]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={s.chipFadeLeft}
                      pointerEvents="none"
                    />
                  )}
                  {!chipAtEnd[mode] && (
                    <LinearGradient
                      colors={[`${c.background}00`, c.background]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={s.chipFadeRight}
                      pointerEvents="none"
                    />
                  )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Korean input */}
          <TextInput
            key={`input-${scheme}`}
            style={[s.input, { color: c.textPrimary }]}
            value={input}
            onChangeText={setInput}
            placeholder="Type in Korean"
            placeholderTextColor={c.textSecondary}
            multiline
            textAlignVertical="top"
          />

          {/* Context toggle */}
          <TouchableOpacity
            style={s.contextToggle}
            onPress={() => setShowContext(!showContext)}
          >
            <Text style={[s.contextToggleText, { color: c.textSecondary }]}>
              {showContext ? "Hide details" : "+ Add details (optional)"}
            </Text>
          </TouchableOpacity>

          {showContext && (
            <TextInput
              key={`context-${scheme}`}
              style={[s.input, s.contextInput, { color: c.textPrimary }]}
              value={context}
              onChangeText={setContext}
              placeholder="e.g. Making plans for the first time — not rescheduling."
              placeholderTextColor={c.textSecondary}
              multiline
              textAlignVertical="top"
            />
          )}

          <TouchableOpacity
            style={[s.button, (!input.trim() || loading) && s.buttonDisabled]}
            onPress={handleConvert}
            disabled={!input.trim() || loading}
          >
            {loading
              ? <ActivityIndicator color={c.buttonText} />
              : <Text style={s.buttonText}>Convert</Text>
            }
          </TouchableOpacity>

          {error && <Text style={s.errorText}>{error}</Text>}

          {/* Results — fade in */}
          {outputs.length > 0 && (
            <Animated.View style={[s.resultList, { opacity: fadeAnim }]}>
              {outputs.map((out, idx) => {
                const badgeStyle = getPaletteStyle(idx + badgeOffset, scheme);
                return (
                  <ExpressionCard
                    key={idx}
                    expression={out.expression}
                    situationLabel={out.situation_label}
                    explanation={out.explanation}
                    badgeStyle={badgeStyle}
                    scheme={scheme}
                    onPress={() => handleCopy(out.expression, idx)}
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
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const makeStyles = (c: typeof Colors.light) =>
  StyleSheet.create({
    scroll: { padding: 20, paddingBottom: 48 },

    // Chip section
    chipSection: { marginBottom: 16, gap: 16 },
    chipGroupRow: { flexDirection: "column", gap: 8 },
    chipGroupLabel: {
      fontSize: 14,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    chipRow: { flexDirection: "row", gap: 8 },
    scrollFadeBottom: {
      position: "absolute", bottom: 0, left: 0, right: 0, height: 48,
    },
    chipFadeLeft: {
      position: "absolute", left: 0, top: 0, bottom: 0, width: 20,
    },
    chipFadeRight: {
      position: "absolute", right: 0, top: 0, bottom: 0, width: 20,
    },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "transparent",
      backgroundColor: c.surface,
    },
    chipText: { fontSize: 18, fontWeight: "500" },

    // Input
    input: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 18,
      color: c.textPrimary,
      minHeight: 100,
      lineHeight: 24,
      marginBottom: 8,
    },

    // Context toggle
    contextToggle: { marginBottom: 0, alignSelf: "flex-start", paddingVertical: 8 },
    contextToggleText: { fontSize: 14, fontWeight: "500" },
    contextInput: { minHeight: 60 },

    // Convert button
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
  });
