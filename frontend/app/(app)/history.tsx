import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import ScreenLayout from "@/components/ScreenLayout";
import { Colors, getPresetStyle, getPaletteStyle, getChipStyle } from "@/constants/colors";
import { useAppTheme } from "@/contexts/ThemeContext";
import { api } from "@/services/api";
import { PRESETS } from "@/constants/presets";

interface Output {
  expression: string;
  situation_label: string;
  explanation: string;
}

interface HistoryItem {
  id: string;
  source: "convert" | "learn";
  category: string;
  sub_category: string | null;
  korean_input: string | null;
  outputs: Output[];
  created_at: string;
}

function getSubLabel(category: string, sub_category: string | null): string {
  if (!sub_category) return "";
  const preset = PRESETS.find((p) => p.id === category);
  const sub = preset?.subCategories.find((s) => s.key === sub_category);
  return sub?.label ?? sub_category;
}

function getCategoryLabel(category: string): string {
  return PRESETS.find((p) => p.id === category)?.label ?? category;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function HistoryScreen() {
  const { scheme } = useAppTheme();
  const c = Colors[scheme];
  const s = useMemo(() => makeStyles(c), [scheme]);

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [listAtTop, setListAtTop] = useState(true);
  const [listAtBottom, setListAtBottom] = useState(false);

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const data = await api.getHistory(q || undefined);
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (text: string) => {
    setQuery(text);
    if (text.length === 0) {
      load();
    } else if (text.length >= 2) {
      load(text);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteHistory(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      // silently fail — item stays in list
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert("Delete", "Remove this entry from history?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => handleDelete(id) },
    ]);
  };

  const handleCopy = async (text: string, key: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const isOpen = expanded === item.id;
    const subLabel = getSubLabel(item.category, item.sub_category);
    const catLabel = getCategoryLabel(item.category);
    const chipStyle = getPresetStyle(item.category, scheme);

    const renderRightActions = () => (
      <TouchableOpacity
        style={s.deleteAction}
        onPress={() => handleDelete(item.id)}
      >
        <Text style={s.deleteText}>Delete</Text>
      </TouchableOpacity>
    );

    return (
      <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <TouchableOpacity
        style={s.card}
        onPress={() => toggleExpand(item.id)}
        onLongPress={() => confirmDelete(item.id)}
        activeOpacity={0.8}
      >
        {/* Header row */}
        <View style={s.cardHeader}>
          <View style={s.badges}>
            <View style={[s.badge, { backgroundColor: chipStyle.bg }]}>
              <Text style={[s.badgeText, { color: chipStyle.text }]}>{catLabel}</Text>
            </View>
            {subLabel ? (
              <View style={[s.badge, { backgroundColor: getChipStyle(item.sub_category!, scheme).bg }]}>
                <Text style={[s.badgeText, { color: getChipStyle(item.sub_category!, scheme).text }]}>{subLabel}</Text>
              </View>
            ) : null}
            {item.source === "learn" && (
              <View style={[s.badge, { backgroundColor: getPaletteStyle(2, scheme).bg }]}>
                <Text style={[s.badgeText, { color: getPaletteStyle(2, scheme).text }]}>Learn</Text>
              </View>
            )}
          </View>
          <Text style={[s.date, { color: c.textSecondary }]}>{formatDate(item.created_at)}</Text>
        </View>

        {/* Korean input (convert) or context label (learn) */}
        <Text style={[s.korean, { color: c.textPrimary }]} numberOfLines={isOpen ? undefined : 2}>
          {item.source === "learn"
            ? `Expressions for: ${subLabel || catLabel}`
            : item.korean_input}
        </Text>

        {/* First expression always visible */}
        {item.outputs[0] && (
          <Text style={[s.expression, { color: c.textSecondary }]} numberOfLines={isOpen ? undefined : 1}>
            {item.outputs[0].expression}
          </Text>
        )}

        {/* Expanded: all outputs */}
        {isOpen && (
          <View style={s.outputList}>
            {item.outputs.map((out, idx) => {
              const copyKey = `${item.id}-${idx}`;
              const copied = copiedKey === copyKey;
              const badgeStyle = getPaletteStyle(idx, scheme);
              return (
                <TouchableOpacity
                  key={idx}
                  style={[s.outputCard, { backgroundColor: c.background, borderColor: c.border }]}
                  onPress={() => handleCopy(out.expression, copyKey)}
                  activeOpacity={0.7}
                >
                  <View style={s.outputCardTop}>
                    <View style={[s.labelBadge, { backgroundColor: badgeStyle.bg }]}>
                      <Text style={[s.labelText, { color: badgeStyle.text }]}>{out.situation_label}</Text>
                    </View>
                    <Text style={[s.copyHint, { color: c.textSecondary }]}>{copied ? "Copied" : "Tap to copy"}</Text>
                  </View>
                  <Text style={[s.outputExpression, { color: c.textPrimary }]}>{out.expression}</Text>
                  <Text style={[s.outputExplanation, { color: c.textSecondary }]}>{out.explanation}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <ScreenLayout title="History">
      <View style={s.searchBar}>
        <TextInput
          style={[s.searchInput, { backgroundColor: c.surface, borderColor: c.border, color: c.textPrimary }]}
          value={query}
          onChangeText={handleSearch}
          placeholder="Search in Korean or English..."
          placeholderTextColor={c.textSecondary}
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <ActivityIndicator color={c.textSecondary} style={{ marginTop: 40 }} />
      ) : items.length === 0 ? (
        <View style={s.emptyState}>
          <Text style={[s.emptyTitle, { color: c.textPrimary }]}>
            {query ? "No results found." : "Nothing here yet."}
          </Text>
          <Text style={[s.emptyHint, { color: c.textSecondary }]}>
            {query ? "Try a different search term." : "Your conversions will appear here."}
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={s.list}
            onScroll={(e) => {
              const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
              setListAtTop(contentOffset.y <= 4);
              setListAtBottom(contentOffset.y + layoutMeasurement.height >= contentSize.height - 4);
            }}
            scrollEventThrottle={16}
          />
          {!listAtTop && (
            <LinearGradient
              colors={[c.background, `${c.background}00`]}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
              style={s.listFadeTop}
              pointerEvents="none"
            />
          )}
          {!listAtBottom && (
            <LinearGradient
              colors={[`${c.background}00`, c.background]}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
              style={s.listFadeBottom}
              pointerEvents="none"
            />
          )}
        </View>
      )}
    </ScreenLayout>
  );
}

const makeStyles = (c: typeof Colors.light) =>
  StyleSheet.create({
    searchBar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
    searchInput: {
      borderWidth: 1, borderRadius: 10,
      paddingHorizontal: 14, paddingVertical: 10,
      fontSize: 18,
      height: 46,
    },
    list: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 0, gap: 16 },
    emptyState: { padding: 24, paddingTop: 48, alignItems: "center", gap: 8 },
    emptyTitle: { fontSize: 18, fontWeight: "500" },
    emptyHint: { fontSize: 14 },
    card: {
      backgroundColor: c.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
      gap: 8,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    badges: { flexDirection: "row", gap: 6 },
    badge: {
      paddingHorizontal: 8, paddingVertical: 3,
      borderRadius: 6,
    },
    badgeText: { fontSize: 14, fontWeight: "600" },
    date: { fontSize: 14 },
    korean: { fontSize: 18, fontWeight: "500", lineHeight: 23 },
    expression: { fontSize: 18, lineHeight: 22 },
    outputList: { gap: 8, marginTop: 8 },
    outputCard: {
      borderWidth: 1, borderRadius: 12,
      padding: 12, gap: 8,
    },
    outputCardTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 8,
    },
    copyHint: { fontSize: 14, marginTop: 3 },
    outputExpression: { fontSize: 22, fontWeight: "700", lineHeight: 28 },
    labelBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 8, paddingVertical: 3,
      borderRadius: 6,
    },
    labelText: { fontSize: 14, fontWeight: "600" },
    outputExplanation: { fontSize: 14, lineHeight: 20 },
    listFadeTop: {
      position: "absolute", top: 0, left: 0, right: 0, height: 24,
    },
    listFadeBottom: {
      position: "absolute", bottom: 0, left: 0, right: 0, height: 24,
    },
    deleteAction: {
      backgroundColor: c.error,
      justifyContent: "center",
      alignItems: "center",
      width: 80,
      borderRadius: 12,
      marginLeft: 8,
    },
    deleteText: { color: c.buttonText, fontSize: 14, fontWeight: "600" },
  });
