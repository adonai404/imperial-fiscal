import { useState } from "react";
import { BarChart3, Upload, Building2, Settings } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { ThemeToggle } from "./ThemeToggle";
interface AppSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}
const sections = [{
  id: "dashboard",
  title: "Dashboard",
  icon: BarChart3
}, {
  id: "import",
  title: "Importação",
  icon: Upload
}, {
  id: "companies",
  title: "Empresas",
  icon: Building2
}, {
  id: "settings",
  title: "Configurações",
  icon: Settings
}];
export function AppSidebar({
  activeSection,
  onSectionChange
}: AppSidebarProps) {
  const {
    state
  } = useSidebar();
  const location = useLocation();
  const isActive = (sectionId: string) => activeSection === sectionId;
  const isCollapsed = state === 'collapsed';
  return <Sidebar collapsible="icon" variant="inset" className="border-r border-border">
      <SidebarHeader className="flex flex-row items-center justify-between p-4">
        {!isCollapsed && <div>
            <h2 className="text-lg font-semibold text-sidebar-foreground">Dados fiscais</h2>
            <p className="text-sm text-sidebar-foreground/60">Empresarial</p>
          </div>}
        <ThemeToggle />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sections.map(section => <SidebarMenuItem key={section.id}>
                  <SidebarMenuButton onClick={() => onSectionChange(section.id)} isActive={isActive(section.id)} className="w-full justify-start">
                    <section.icon className="h-4 w-4" />
                    {!isCollapsed && <span>{section.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>;
}