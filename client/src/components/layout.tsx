import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, CheckSquare, LogOut, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavLink = ({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) => {
    const isActive = location === href;
    return (
      <Link href={href}>
        <div
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer
            ${isActive 
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }
          `}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <Icon className="w-5 h-5" />
          <span className="font-medium">{children}</span>
        </div>
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold font-display tracking-tight">TaskMaster</h1>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        <NavLink href="/" icon={CheckSquare}>Tasks</NavLink>
        {/* Add more links here as app grows */}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-muted/50 rounded-2xl p-4 border border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} />
              <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate">{user?.username}</p>
              <p className="text-xs text-muted-foreground truncate">Free Plan</p>
            </div>
          </div>
          <Separator className="mb-3" />
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 -ml-2" 
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 border-r border-border bg-card/50 backdrop-blur-xl fixed h-full z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-background/80 backdrop-blur-md z-40 flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <span className="font-bold font-display">TaskMaster</span>
        </div>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      <main className="flex-1 lg:ml-72 min-h-screen pt-16 lg:pt-0">
        <div className="max-w-5xl mx-auto p-4 md:p-8 lg:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
