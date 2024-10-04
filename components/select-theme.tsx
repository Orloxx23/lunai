import { useTheme } from "next-themes";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import React, { useEffect, useState } from "react";
import {
  IconDeviceDesktop,
  IconDevicesPc,
  IconMoon,
  IconSun,
} from "@tabler/icons-react";

export default function SelectTheme() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const ICON_SIZE = 16;

  return (
    <div className="">
      <ToggleGroup
        type="single"
        className="p-0"
        value={theme}
        onValueChange={setTheme}
      >
        <ToggleGroupItem value="light" aria-label="Toggle bold">
          <IconSun size={ICON_SIZE} />
        </ToggleGroupItem>
        <ToggleGroupItem value="dark" aria-label="Toggle italic">
          <IconMoon size={ICON_SIZE} />
        </ToggleGroupItem>
        <ToggleGroupItem value="system" aria-label="Toggle underline">
          <IconDeviceDesktop size={ICON_SIZE} />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
