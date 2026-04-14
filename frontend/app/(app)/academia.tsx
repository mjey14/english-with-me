import ConvertScreen from "@/components/ConvertScreen";
import { PRESETS } from "@/constants/presets";

const preset = PRESETS.find((p) => p.id === "academia")!;

export default function AcademiaScreen() {
  return (
    <ConvertScreen
      title={preset.label}
      category="academia"
      subCategories={preset.subCategories}
    />
  );
}
