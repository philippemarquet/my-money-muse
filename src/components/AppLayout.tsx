import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SpaceSwitcher } from "@/components/SpaceSwitcher";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="flex h-14 items-center justify-between px-6">
            <SidebarTrigger />
            <div className="flex items-center gap-3">
              <SpaceSwitcher />
            </div>
          </header>
          <div className="px-6 pb-8">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
