import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,

  Modal,
  Animated,
  Pressable,
} from "react-native";
import { useRef, useEffect, useState } from "react";
import { useRouter, usePathname } from "expo-router";
import { Colors, getPresetStyle } from "@/constants/colors";
import { useAppTheme } from "@/contexts/ThemeContext";
import { PRESETS, DEFAULT_ENABLED } from "@/constants/presets";
import { api } from "@/services/api";

const STUDY_ITEMS = [
  { label: "Browse expressions", route: "/(app)/learn" },
  { label: "Quiz myself", route: "/(app)/review" },
];

const SECONDARY_ITEMS = [
  { label: "History", route: "/(app)/history" },
  { label: "Settings", route: "/(app)/settings" },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function MenuDrawer({ visible, onClose }: Props) {
  const { scheme } = useAppTheme();
  const c = Colors[scheme];
  const router = useRouter();
  const pathname = usePathname();
  const slideAnim = useRef(new Animated.Value(-280)).current;
  const [enabledModes, setEnabledModes] = useState<string[]>(DEFAULT_ENABLED);

  useEffect(() => {
    if (!visible) return;
    api.getProfile().then((data) => {
      if (data.enabled_modes) setEnabledModes(data.enabled_modes);
    }).catch(() => {});
  }, [visible]);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -280,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const navigate = (route: string) => {
    onClose();
    router.push(route as any);
  };

  const isActive = (route: string) =>
    pathname === route.replace("/(app)", "") || pathname === route;

  const activePresets = PRESETS.filter((p) => enabledModes.includes(p.id));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View
          style={[
            styles.drawer,
            { backgroundColor: c.background, borderRightColor: c.border },
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <Text style={[styles.appName, { color: c.textSecondary }]}>
            English With Me
          </Text>

          <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
            Convert
          </Text>
          {activePresets.map((preset) => {
            const active = isActive(preset.route);
            const ps = getPresetStyle(preset.id, scheme);
            return (
              <TouchableOpacity
                key={preset.id}
                style={[
                  styles.menuItem,
                  active && { backgroundColor: ps.bg },
                ]}
                onPress={() => navigate(preset.route)}
              >
                <Text
                  style={[
                    styles.menuLabel,
                    { color: active ? ps.text : c.textPrimary, fontWeight: active ? "600" : "400" },
                  ]}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          <View style={[styles.divider, { backgroundColor: c.border }]} />

          <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
            Study
          </Text>
          {STUDY_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={[
                styles.menuItem,
                isActive(item.route) && { backgroundColor: c.surface },
              ]}
              onPress={() => navigate(item.route)}
            >
              <Text
                style={[
                  styles.menuLabel,
                  { color: isActive(item.route) ? c.textPrimary : c.textPrimary, fontWeight: isActive(item.route) ? "600" : "400" },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={[styles.divider, { backgroundColor: c.border }]} />

          {SECONDARY_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={[
                styles.menuItem,
                isActive(item.route) && { backgroundColor: c.surface },
              ]}
              onPress={() => navigate(item.route)}
            >
              <Text
                style={[
                  styles.secondaryLabel,
                  { color: c.textSecondary, fontWeight: isActive(item.route) ? "600" : "400" },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: "row" },
  backdrop: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  drawer: {
    width: 260,
    height: "100%",
    paddingTop: 80,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    zIndex: 10,
  },
  appName: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 32,
    marginLeft: 4,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 0,
  },
  menuLabel: { fontSize: 18, fontWeight: "500" },
  secondaryLabel: { fontSize: 18, fontWeight: "400" },
  divider: { height: 1, marginVertical: 16 },
});
