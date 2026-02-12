import { useMemo } from "react";
import { useSpace } from "@/hooks/useSpace";
import { Landmark } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function SpaceSwitcher({ className }: { className?: string }) {
  const { spaces, spacesLoading, selectedSpaceId, setSelectedSpaceId } = useSpace();

  const value = selectedSpaceId === null ? "__ALL__" : selectedSpaceId;

  const label = useMemo(() => {
    if (selectedSpaceId === null) return "Alles";
    return spaces.find((s) => s.id === selectedSpaceId)?.name ?? "Space";
  }, [selectedSpaceId, spaces]);

  return (
    <Select
      value={value}
      onValueChange={(v) => setSelectedSpaceId(v === "__ALL__" ? null : v)}
      disabled={spacesLoading}
    >
      <SelectTrigger
        className={cn(
          "w-[240px] rounded-xl border-0 bg-card shadow-sm justify-between",
          className
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Landmark className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Kies space">
            <span className="truncate">{label}</span>
          </SelectValue>
        </div>
      </SelectTrigger>

      <SelectContent className="rounded-xl border-0 shadow-lg">
        <SelectItem value="__ALL__">Alles</SelectItem>
        {spaces.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
