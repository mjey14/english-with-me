import ConvertScreen from "@/components/ConvertScreen";
import { PRESETS } from "@/constants/presets";

const preset = PRESETS.find((p) => p.id === "work")!;

export default function WorkScreen() {
  return (
    <ConvertScreen
      title={preset.label}
      category="work"
      subCategories={preset.subCategories}
    />
  );
}
