import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Tag,
  Landmark,
  Settings,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Transacties", url: "/transacties", icon: ArrowLeftRight },
  { title: "Budgetten", url: "/budgetten", icon: PiggyBank },
  { title: "Categorieën", url: "/categorieen", icon: Tag },
  { title: "Rekeningen", url: "/rekeningen", icon: Landmark },
  { title: "Instellingen", url: "/instellingen", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="flex items-center gap-3 px-4 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-serif font-bold text-lg">
          B
        </div>
        {!collapsed && (
          <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
            BudgetFlow
          </span>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="rounded-xl px-3 py-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      activeClassName="bg-secondary text-foreground font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
