import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useAppTheme } from "@/contexts/ThemeContext";
import MenuDrawer from "./MenuDrawer";

interface Props {
  title: string;
  children: React.ReactNode;
}

export default function ScreenLayout({ title, children }: Props) {
  const { scheme } = useAppTheme();
  const c = Colors[scheme];
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.hamburger}>
          <View style={[styles.bar, { backgroundColor: c.textPrimary }]} />
          <View style={[styles.bar, { backgroundColor: c.textPrimary }]} />
          <View style={[styles.bar, { backgroundColor: c.textPrimary }]} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>{children}</View>

      <MenuDrawer visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  hamburger: {
    width: 32,
    gap: 5,
    paddingVertical: 4,
  },
  bar: {
    height: 2,
    width: 22,
    borderRadius: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  placeholder: { width: 32 },
  content: { flex: 1 },
});
