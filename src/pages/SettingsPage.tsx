import { Card, CardContent } from "@/components/ui/card";
import { User, Bell, Palette } from "lucide-react";

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold">Instellingen</h1>
        <p className="text-muted-foreground mt-1">Beheer je account en voorkeuren</p>
      </div>

      <div className="space-y-4 max-w-2xl">
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">Profiel</h3>
              <p className="text-sm text-muted-foreground">Naam, e-mail en avatar aanpassen</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">Notificaties</h3>
              <p className="text-sm text-muted-foreground">Meldingen en herinneringen instellen</p>
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
      </div>
    </div>
  );
};

export default SettingsPage;
