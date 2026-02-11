import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="flex h-14 items-center px-6">
            <SidebarTrigger />
          </header>
          <div className="px-6 pb-8">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
