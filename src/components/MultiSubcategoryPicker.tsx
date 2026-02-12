import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import type { SubPick } from "./SubcategoryPicker";

function getLucideIconByName(name: string | null | undefined) {
  const key = (name ?? "").trim();
  const fallback = (LucideIcons as any).Tag as any;
  const Icon = (LucideIcons as any)[key] as any;
  return Icon ?? fallback;
}

function alphaBackground(color: string, alpha = 0.14) {
  const c = (color ?? "").trim();
  const hslMatch = c.match(/^hsl\((.+)\)$/i);
  if (hslMatch) return `hsla(${hslMatch[1]}, ${alpha})`;
  const hexMatch = c.match(/^#([0-9a-f]{6})$/i);
  if (hexMatch) return `${c}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
  return `color-mix(in srgb, ${c} ${Math.round(alpha * 100)}%, transparent)`;
}

function formatLabel(sub: SubPick) {
  return `${sub.cat_name} — ${sub.sub_name}`;
}

export function MultiSubcategoryPicker({
  value,
  onChange,
  options,
  placeholder = "Kies subcategorieën",
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  options: SubPick[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeCatId, setActiveCatId] = useState<string | null>(null);

  const [qCat, setQCat] = useState("");
  const [qSub, setQSub] = useState("");

  const selectedSubs = useMemo(
    () => value.map((id) => options.find((o) => o.sub_id === id)).filter(Boolean) as SubPick[],
    [value, options]
  );

  const cats = useMemo(() => {
    const map = new Map<
      string,
      {
        cat_id: string;
        cat_name: string;
        cat_type: "inkomsten" | "uitgaven";
        cat_color: string;
        cat_icon?: string;
        count: number;
      }
    >();

    for (const o of options) {
      if (!map.has(o.cat_id)) {
        map.set(o.cat_id, {
          cat_id: o.cat_id,
          cat_name: o.cat_name,
          cat_type: o.cat_type,
          cat_color: o.cat_color,
          cat_icon: o.cat_icon,
          count: 0,
        });
      }
      map.get(o.cat_id)!.count += 1;
    }

    const list = Array.from(map.values()).sort((a, b) => a.cat_name.localeCompare(b.cat_name));
    const q = qCat.trim().toLowerCase();
    if (!q) return list;

    return list.filter((c) => c.cat_name.toLowerCase().includes(q));
  }, [options, qCat]);

  const activeCat = useMemo(() => {
    if (activeCatId) return cats.find((c) => c.cat_id === activeCatId) ?? null;
    return cats[0] ?? null;
  }, [activeCatId, cats]);

  const subsForActive = useMemo(() => {
    if (!activeCat) return [];
    const list = options
      .filter((o) => o.cat_id === activeCat.cat_id)
      .sort((a, b) => a.sub_name.localeCompare(b.sub_name));

    const q = qSub.trim().toLowerCase();
    if (!q) return list;

    return list.filter((s) => s.sub_name.toLowerCase().includes(q));
  }, [options, activeCat, qSub]);

  const toggle = (subId: string) => {
    const next = value.includes(subId) ? value.filter((x) => x !== subId) : [...value, subId];
    onChange(next);
  };

  const clear = () => onChange([]);

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (v) {
      if (!activeCatId && cats[0]) setActiveCatId(cats[0].cat_id);
      setQCat("");
      setQSub("");
    }
  };

  const triggerText =
    selectedSubs.length === 0
      ? placeholder
      : selectedSubs.length === 1
      ? formatLabel(selectedSubs[0])
      : `${selectedSubs.length} subcategorieën geselecteerd`;

  // Trigger icon/color: use first selected if exists else neutral
  const triggerColor = selectedSubs[0]?.cat_color ?? "hsl(30, 10%, 50%)";
  const TriggerIcon = selectedSubs[0] ? getLucideIconByName(selectedSubs[0].cat_icon) : (LucideIcons as any).Tag;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button type="button" variant="secondary" className="w-full justify-between rounded-xl bg-card shadow-sm border-0">
          <span className="flex items-center gap-2 min-w-0">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-xl shrink-0"
              style={{ backgroundColor: alphaBackground(triggerColor), color: triggerColor }}
            >
              <TriggerIcon className="h-4 w-4" />
            </span>

            <span className={cn("truncate", selectedSubs.length === 0 && "text-muted-foreground")}>
              {triggerText}
            </span>
          </span>

          <span className="flex items-center gap-2">
            {selectedSubs.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clear();
                }}
                title="Wissen"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[680px] p-0 rounded-2xl border-0 shadow-xl">
        <div className="flex">
          {/* Left: categories */}
          <div className="w-[280px] border-r border-border">
            <div className="px-3 pt-3 pb-2">
              <div className="text-xs text-muted-foreground mb-2">Categorie</div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={qCat}
                  onChange={(e) => setQCat(e.target.value)}
                  placeholder="Zoek categorie…"
                  className="pl-9 rounded-xl"
                />
              </div>
            </div>

            <ScrollArea className="h-[420px]">
              <div className="p-2 space-y-1">
                {cats.length === 0 && (
                  <div className="p-3 text-sm text-muted-foreground">Geen categorieën gevonden.</div>
                )}

                {cats.map((c) => {
                  const Icon = getLucideIconByName(c.cat_icon);
                  const active = activeCat?.cat_id === c.cat_id;

                  return (
                    <button
                      key={c.cat_id}
                      type="button"
                      onClick={() => setActiveCatId(c.cat_id)}
                      className={cn(
                        "w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-colors",
                        active ? "bg-secondary text-foreground" : "hover:bg-secondary/70 text-muted-foreground"
                      )}
                    >
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-xl shrink-0"
                        style={{ backgroundColor: alphaBackground(c.cat_color), color: c.cat_color }}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate text-sm font-medium">{c.cat_name}</span>
                        <span className="block text-xs text-muted-foreground">{c.count} sub</span>
                      </span>
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Right: subcategories */}
          <div className="flex-1">
            <div className="px-3 pt-3 pb-2 border-b border-border">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground mb-2">
                    Subcategorie{activeCat ? ` — ${activeCat.cat_name}` : ""}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground shrink-0">
                  {value.length} geselecteerd
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={qSub}
                  onChange={(e) => setQSub(e.target.value)}
                  placeholder="Zoek subcategorie…"
                  className="pl-9 rounded-xl"
                />
              </div>

              {value.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedSubs.slice(0, 8).map((s) => (
                    <Badge key={s.sub_id} variant="secondary" className="rounded-lg text-xs font-normal gap-1">
                      {formatLabel(s)}
                      <button type="button" onClick={() => toggle(s.sub_id)} title="Verwijderen">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {selectedSubs.length > 8 && (
                    <Badge variant="secondary" className="rounded-lg text-xs font-normal">
                      +{selectedSubs.length - 8} meer
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <ScrollArea className="h-[420px]">
              <div className="p-2 space-y-1">
                {subsForActive.length === 0 && (
                  <div className="p-3 text-sm text-muted-foreground">Geen subcategorieën gevonden.</div>
                )}

                {subsForActive.map((s) => {
                  const checked = value.includes(s.sub_id);
                  return (
                    <button
                      key={s.sub_id}
                      type="button"
                      onClick={() => toggle(s.sub_id)}
                      className={cn(
                        "w-full flex items-center justify-between rounded-xl px-3 py-2 text-left transition-colors",
                        checked ? "bg-primary/10" : "hover:bg-secondary/70"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Checkbox checked={checked} onCheckedChange={() => toggle(s.sub_id)} />
                        <span className="text-sm">{s.sub_name}</span>
                      </span>

                      {checked && (
                        <Badge variant="secondary" className="rounded-lg text-xs font-normal">
                          geselecteerd
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="p-3 border-t border-border flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={clear}>
                Wissen
              </Button>
              <Button type="button" className="rounded-xl" onClick={() => setOpen(false)}>
                Klaar
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
