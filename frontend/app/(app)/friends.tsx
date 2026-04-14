import ConvertScreen from "@/components/ConvertScreen";
import { PRESETS } from "@/constants/presets";

const preset = PRESETS.find((p) => p.id === "friends")!;

export default function FriendsScreen() {
  return (
    <ConvertScreen
      title={preset.label}
      category="friends"
      subCategories={preset.subCategories}
    />
  );
}
