import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, Bell, Palette, LogOut, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useHousehold } from "@/hooks/useHousehold";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const { profile, householdId } = useHousehold();
  const [showProfile, setShowProfile] = useState(false);
  const [showPartner, setShowPartner] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [partnerEmail, setPartnerEmail] = useState("");

  const handleUpdateProfile = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("user_id", user!.id);
      if (error) throw error;
      toast.success("Profiel bijgewerkt");
      setShowProfile(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleInvitePartner = async () => {
    toast.info("Partner uitnodigen: deel je huishoud-ID met je partner zodat zij zich kunnen koppelen.");
    setShowPartner(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold">Instellingen</h1>
        <p className="text-muted-foreground mt-1">Beheer je account en voorkeuren</p>
      </div>

      <div className="space-y-4 max-w-2xl">
        <Card
          className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => { setDisplayName(profile?.display_name || ""); setShowProfile(true); }}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">Profiel</h3>
              <p className="text-sm text-muted-foreground">{user?.email} — {profile?.display_name || "Geen naam"}</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setShowPartner(true)}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">Partner koppelen</h3>
              <p className="text-sm text-muted-foreground">Deel je financiën met je partner</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">Weergave</h3>
              <p className="text-sm text-muted-foreground">Thema en lay-out voorkeuren</p>
            </div>
          </CardContent>
        </Card>

        <Button
          variant="outline"
          className="rounded-xl gap-2 text-expense border-expense/30 hover:bg-expense/5"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" /> Uitloggen
        </Button>
      </div>

      {/* Profile dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="rounded-2xl border-0 shadow-xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Profiel bewerken</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input value={user?.email || ""} disabled className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Naam</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setShowProfile(false)}>Annuleren</Button>
            <Button className="rounded-xl" onClick={handleUpdateProfile}>Opslaan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Partner dialog */}
      <Dialog open={showPartner} onOpenChange={setShowPartner}>
        <DialogContent className="rounded-2xl border-0 shadow-xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Partner koppelen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Je huishoud-ID is: <code className="bg-secondary px-2 py-1 rounded-lg text-xs">{householdId}</code>
            </p>
            <p className="text-sm text-muted-foreground">
              Deel dit ID met je partner. Zij kan dit invoeren bij registratie om samen te werken.
            </p>
          </div>
          <DialogFooter>
            <Button className="rounded-xl" onClick={() => { navigator.clipboard.writeText(householdId || ""); toast.success("Gekopieerd!"); }}>
              Kopieer ID
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
