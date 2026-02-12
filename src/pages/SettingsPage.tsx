import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Bell, Layers, Plus, Pencil, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { useSpaces } from "@/hooks/useSpaces";
import { useSpace } from "@/hooks/useSpace";

const SettingsPage = () => {
  const { spacesQuery, profileQuery, createSpace, renameSpace, deleteSpace, setDefaultSpace } = useSpaces();
  const { setSelectedSpaceId } = useSpace();

  const spaces = spacesQuery.data ?? [];
  const defaultSpaceId = profileQuery.data?.household_id ?? null;

  const [createOpen, setCreateOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [newName, setNewName] = useState("");
  const [renameName, setRenameName] = useState("");
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);

  const activeSpace = useMemo(() => {
    if (!activeSpaceId) return null;
    return spaces.find((s) => s.id === activeSpaceId) ?? null;
  }, [activeSpaceId, spaces]);

  const openRename = (id: string) => {
    const s = spaces.find((x) => x.id === id);
    setActiveSpaceId(id);
    setRenameName(s?.name ?? "");
    setRenameOpen(true);
  };

  const openDelete = (id: string) => {
    setActiveSpaceId(id);
    setDeleteOpen(true);
  };

  const handleCreate = async () => {
    try {
      const name = newName.trim();
      if (!name) {
        toast.error("Geef een naam op voor je space");
        return;
      }

      const id = await createSpace.mutateAsync(name);
      toast.success("Space aangemaakt");

      setCreateOpen(false);
      setNewName("");

      // meteen switchen naar nieuwe space (logisch UX)
      setSelectedSpaceId(id);
    } catch (e: any) {
      toast.error(e.message ?? "Fout bij aanmaken");
    }
  };

  const handleRename = async () => {
    try {
      if (!activeSpaceId) return;
      const name = renameName.trim();
      if (!name) {
        toast.error("Geef een naam op");
        return;
      }

      await renameSpace.mutateAsync({ id: activeSpaceId, name });
      toast.success("Space hernoemd");
      setRenameOpen(false);
    } catch (e: any) {
      toast.error(e.message ?? "Fout bij hernoemen");
    }
  };

  const handleDelete = async () => {
    try {
      if (!activeSpaceId) return;
      await deleteSpace.mutateAsync(activeSpaceId);
      toast.success("Space verwijderd");
      setDeleteOpen(false);

      // als je net de geselecteerde space verwijdert: ga naar Alles (veilig)
      setSelectedSpaceId(null);
    } catch (e: any) {
      toast.error(e.message ?? "Fout bij verwijderen");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultSpace.mutateAsync(id);
      toast.success("Default space ingesteld");
    } catch (e: any) {
      toast.error(e.message ?? "Fout bij instellen");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold">Instellingen</h1>
        <p className="text-muted-foreground mt-1">Beheer je account en voorkeuren</p>
      </div>

      <div className="space-y-4 max-w-3xl">
        {/* Profiel */}
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">Profiel</h3>
              <p className="text-sm text-muted-foreground">Naam, e-mail en avatar aanpassen</p>
            </div>
            <Badge variant="secondary" className="rounded-lg text-xs font-normal">
              later
            </Badge>
          </CardContent>
        </Card>

        {/* Notificaties */}
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Bell className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">Notificaties</h3>
              <p className="text-sm text-muted-foreground">Meldingen en herinneringen instellen</p>
            </div>
            <Badge variant="secondary" className="rounded-lg text-xs font-normal">
              later
            </Badge>
          </CardContent>
        </Card>

        {/* Spaces beheer */}
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">Spaces</h3>
                  <p className="text-sm text-muted-foreground">Beheer je budget-ruimtes (Privé, Gezamenlijk, ...)</p>
                </div>
              </div>

              <Button className="rounded-xl gap-2" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Nieuwe space
              </Button>
            </div>

            <div className="space-y-2">
              {spacesQuery.isLoading && (
                <div className="text-sm text-muted-foreground py-3">Spaces laden...</div>
              )}

              {!spacesQuery.isLoading && spaces.length === 0 && (
                <div className="text-sm text-muted-foreground py-3">Nog geen spaces gevonden.</div>
              )}

              {spaces.map((s) => {
                const isDefault = defaultSpaceId === s.id;

                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-2xl bg-card shadow-sm px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium truncate">{s.name}</div>
                        {isDefault && (
                          <Badge variant="secondary" className="rounded-lg text-xs font-normal gap-1">
                            <Star className="h-3.5 w-3.5" />
                            default
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Space ID: <span className="font-mono">{s.id}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        className="rounded-xl"
                        onClick={() => handleSetDefault(s.id)}
                        disabled={isDefault || setDefaultSpace.isPending}
                      >
                        Default
                      </Button>

                      <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => openRename(s.id)}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>

                      <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => openDelete(s.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl border-0 shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Nieuwe space</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Naam</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="rounded-xl"
              placeholder="Bijv. Gezamenlijk"
            />
            <p className="text-xs text-muted-foreground">
              Tip: maak minimaal “Gezamenlijk” en “Privé”.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setCreateOpen(false)}>
              Annuleren
            </Button>
            <Button className="rounded-xl" onClick={handleCreate} disabled={createSpace.isPending}>
              {createSpace.isPending ? "Bezig..." : "Aanmaken"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="rounded-2xl border-0 shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Space hernoemen</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Naam</Label>
            <Input
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              className="rounded-xl"
              placeholder="Nieuwe naam"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setRenameOpen(false)}>
              Annuleren
            </Button>
            <Button className="rounded-xl" onClick={handleRename} disabled={renameSpace.isPending}>
              {renameSpace.isPending ? "Bezig..." : "Opslaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-2xl border-0 shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Space verwijderen</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <p className="text-sm">
              Weet je zeker dat je deze space wilt verwijderen?
            </p>
            {activeSpace && (
              <div className="rounded-xl bg-muted p-3 text-sm">
                <div className="font-medium">{activeSpace.name}</div>
                <div className="text-xs text-muted-foreground font-mono">{activeSpace.id}</div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Let op: je kunt je <b>laatste</b> space niet verwijderen.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleteOpen(false)}>
              Annuleren
            </Button>
            <Button variant="destructive" className="rounded-xl" onClick={handleDelete} disabled={deleteSpace.isPending}>
              {deleteSpace.isPending ? "Bezig..." : "Verwijderen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
