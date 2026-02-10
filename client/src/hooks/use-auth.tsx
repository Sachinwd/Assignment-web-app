import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type InsertUser, type User } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  loginMutation: ReturnType<typeof useLoginMutation>;
  registerMutation: ReturnType<typeof useRegisterMutation>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

function useLoginMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Invalid username or password");
        }
        throw new Error("Login failed");
      }

      return await res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      queryClient.setQueryData([api.auth.me.path], data.user);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

function useRegisterMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await fetch(api.auth.register.path, {
        method: api.auth.register.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        if (res.status === 409) {
          throw new Error("Username already taken");
        }
        throw new Error("Registration failed");
      }

      return await res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      queryClient.setQueryData([api.auth.me.path], data.user);
      toast({
        title: "Account created",
        description: "Welcome to TaskMaster!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      if (!token) return null;
      const res = await fetch(api.auth.me.path, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        setToken(null);
        return null;
      }
      if (!res.ok) throw new Error("Failed to fetch user");
      return await res.json();
    },
    enabled: !!token,
  });

  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    queryClient.setQueryData([api.auth.me.path], null);
    queryClient.clear();
  };

  // Sync token state with localStorage changes (e.g. from mutations)
  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("token"));
    };
    window.addEventListener("storage", handleStorageChange);
    // Also listen to mutation successes which manually set localStorage
    if (loginMutation.isSuccess || registerMutation.isSuccess) {
      setToken(localStorage.getItem("token"));
    }
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [loginMutation.isSuccess, registerMutation.isSuccess]);

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        loginMutation,
        registerMutation,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Helper to add auth header to requests
export function getAuthHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
