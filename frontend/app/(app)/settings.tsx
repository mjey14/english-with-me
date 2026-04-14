import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import ScreenLayout from "@/components/ScreenLayout";
import { Colors, getPresetStyle } from "@/constants/colors";
import { useAppTheme } from "@/contexts/ThemeContext";
import type { AppScheme } from "@/constants/colors";
import { PRESETS, DEFAULT_ENABLED } from "@/constants/presets";
import { api } from "@/services/api";
import { useUser } from "@/contexts/UserContext";

export default function SettingsScreen() {
  const { scheme, setScheme } = useAppTheme();
  const { setEnabledModes: setContextModes } = useUser();
  const c = Colors[scheme];

  const [description, setDescription] = useState("");
  const [savedDescription, setSavedDescription] = useState("");
  const [enabledModes, setEnabledModes] = useState<string[]>(DEFAULT_ENABLED);
  const [savedModes, setSavedModes] = useState<string[]>(DEFAULT_ENABLED);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    api.getProfile().then((data) => {
      const val = data.role_model_description ?? "";
      setDescription(val);
      setSavedDescription(val);
      const modes = data.enabled_modes ?? DEFAULT_ENABLED;
      setEnabledModes(modes);
      setSavedModes(modes);
    }).finally(() => setLoading(false));
  }, []);

  const toggleMode = (id: string) => {
    setEnabledModes((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
    setStatus("idle");
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus("idle");
    try {
      await Promise.all([
        description !== savedDescription
          ? api.updateProfile(description)
          : Promise.resolve(),
        JSON.stringify(enabledModes.sort()) !== JSON.stringify(savedModes.sort())
          ? api.updateModes(enabledModes)
          : Promise.resolve(),
      ]);
      setSavedDescription(description);
      setSavedModes(enabledModes);
      setContextModes(enabledModes);
      setStatus("saved");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const isDirty =
    description !== savedDescription ||
    JSON.stringify(enabledModes.sort()) !== JSON.stringify(savedModes.sort());

  const s = useMemo(() => makeStyles(c), [scheme]);

  if (loading) {
    return (
      <ScreenLayout title="Settings">
        <ActivityIndicator color={c.textSecondary} style={{ marginTop: 40 }} />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="Settings">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={s.scroll}>

          {/* Modes */}
          <Text style={s.sectionLabel}>Active Modes</Text>
          <Text style={s.hint}>Choose which categories appear in your menu.</Text>
          <View style={s.modeList}>
            {PRESETS.map((preset) => {
              const active = enabledModes.includes(preset.id);
              const ps = getPresetStyle(preset.id, scheme);
              return (
                <TouchableOpacity
                  key={preset.id}
                  style={[s.modeRow, active && { borderColor: ps.text, backgroundColor: ps.bg }]}
                  onPress={() => toggleMode(preset.id)}
                >
                  <Text style={[s.modeLabel, { color: active ? ps.text : c.textPrimary }]}>
                    {preset.label}
                  </Text>
                  <View style={[s.toggle, { backgroundColor: active ? ps.text : c.border }]}>
                    <Text style={[s.toggleText, { color: c.buttonText }]}>{active ? "On" : "Off"}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Display */}
          <Text style={[s.sectionLabel, { marginTop: 24 }]}>Display</Text>
          <View key={scheme} style={s.themeSelector}>
            {(["light", "dark", "warm"] as AppScheme[]).map((mode) => {
              const active = scheme === mode;
              const labels: Record<AppScheme, string> = { light: "Light", dark: "Dark", warm: "Warm" };
              return (
                <TouchableOpacity
                  key={mode}
                  style={[s.themeOption, active && s.themeOptionActive]}
                  onPress={() => setScheme(mode)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.themeLabel, { color: active ? c.textPrimary : c.textSecondary }]}>
                    {labels[mode]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Role Model */}
          <Text style={[s.sectionLabel, { marginTop: 24 }]}>English Role Model</Text>
          <Text style={s.hint}>
            Describe your target English style. Applied to every output in the app.
          </Text>
          <TextInput
            key={`rolemodel-${scheme}`}
            style={[s.input, { color: c.textPrimary }]}
            value={description}
            onChangeText={(t) => { setDescription(t); setStatus("idle"); }}
            placeholder="e.g. Michelle Obama / Cate Blanchett — articulate, warm but powerful, precise word choice."
            placeholderTextColor={c.textSecondary}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Save bar — always visible when dirty */}
      {(isDirty || status === "saved" || status === "error") && (
        <View style={s.saveBar}>
          {status === "saved" && <Text style={s.successText}>Saved.</Text>}
          {status === "error" && <Text style={s.errorText}>Something went wrong. Try again.</Text>}
          <TouchableOpacity
            style={[s.button, (!isDirty || saving) && s.buttonDisabled]}
            onPress={handleSave}
            disabled={!isDirty || saving}
          >
            <Text style={s.buttonText}>{saving ? "Saving..." : "Save"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScreenLayout>
  );
}

const makeStyles = (c: typeof Colors.light) =>
  StyleSheet.create({
    scroll: { padding: 16, paddingBottom: 48 },
    sectionLabel: {
      fontSize: 14, fontWeight: "600", color: c.textSecondary,
      textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8,
    },
    hint: { fontSize: 14, color: c.textSecondary, lineHeight: 20, marginBottom: 8 },
    modeList: { gap: 8 },
    modeRow: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      padding: 12, borderRadius: 12, borderWidth: 1, borderColor: c.border,
      backgroundColor: c.surface,
    },
    modeLabel: { fontSize: 18, fontWeight: "500" },
    toggle: {
      paddingHorizontal: 10, paddingVertical: 2, borderRadius: 6,
    },
    toggleText: { fontSize: 18, fontWeight: "600", color: c.buttonText },
    themeSelector: {
      flexDirection: "row",
      borderRadius: 12,
      padding: 3,
      backgroundColor: c.surface,
      gap: 2,
    },
    themeOption: {
      flex: 1,
      paddingVertical: 8,
      alignItems: "center",
      borderRadius: 9,
    },
    themeOptionActive: {
      backgroundColor: c.background,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 3,
      elevation: 2,
    },
    themeLabel: { fontSize: 18, fontWeight: "500" },
    input: {
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
      borderRadius: 12, padding: 16, fontSize: 18, color: c.textPrimary,
      lineHeight: 22, minHeight: 120,
    },
    button: {
      backgroundColor: c.buttonBg, borderRadius: 12,
      paddingVertical: 16, alignItems: "center",
    },
    buttonDisabled: { opacity: 0.4 },
    buttonText: { color: c.buttonText, fontSize: 18, fontWeight: "600" },
    saveBar: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 16,
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.background,
      gap: 8,
    },
    successText: { fontSize: 14, color: c.textSecondary, textAlign: "right" },
    errorText: { fontSize: 14, color: c.error },
  });
