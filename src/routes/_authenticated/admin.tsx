import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Loader2, Plus, Trash2, Eye, EyeOff, LogOut } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Manage jewellery items | Navratri stall admin" },
      {
        name: "description",
        content:
          "Add, hide or remove the jewellery items shoppers can pick when leaving a review at the stall.",
      },
      { property: "og:title", content: "Manage jewellery items" },
      {
        property: "og:description",
        content: "Add, hide or remove the items shown on the review form.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type Category = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

function AdminPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [newName, setNewName] = useState("");

  const isAdmin = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;
      await supabase.rpc("claim_admin");
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.user.id,
        _role: "admin",
      });
      if (error) throw error;
      return Boolean(data);
    },
  });

  const categories = useQuery({
    queryKey: ["categories", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, sort_order, is_active")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["categories"] });
  }

  const add = useMutation({
    mutationFn: async () => {
      const name = newName.trim();
      if (!name) throw new Error("Please type an item name");
      const nextOrder = (categories.data?.at(-1)?.sort_order ?? 0) + 1;
      const { error } = await supabase.from("categories").insert({ name, sort_order: nextOrder });
      if (error) {
        throw new Error(
          error.code === "23505" ? "That item already exists" : "Could not add that item",
        );
      }
    },
    onSuccess: () => {
      setNewName("");
      toast.success("Item added");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggle = useMutation({
    mutationFn: async (category: Category) => {
      const { error } = await supabase
        .from("categories")
        .update({ is_active: !category.is_active })
        .eq("id", category.id);
      if (error) throw new Error("Could not update that item");
    },
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw new Error("Could not remove that item");
    },
    onSuccess: () => {
      toast.success("Item removed");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  function onAdd(event: FormEvent) {
    event.preventDefault();
    add.mutate();
  }

  if (isAdmin.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!isAdmin.data) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
        <div className="panel p-7 text-center">
          <h1 className="text-2xl font-semibold">Not the owner account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This account cannot manage the item list. Sign in with the stall owner's email.
          </p>
          <Button className="mt-5" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-primary">Stall admin</p>
          <h1 className="mt-2 text-3xl font-semibold">
            <span className="text-gradient-gold">What did you buy?</span> items
          </h1>
        </div>
        <Button variant="secondary" onClick={signOut}>
          <LogOut size={16} /> Sign out
        </Button>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        These are the choices shoppers tap on the review form. Hidden items stay on old reviews but
        are no longer offered.
      </p>

      <form onSubmit={onAdd} className="panel mt-7 flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="new-item">Add an item</Label>
          <Input
            id="new-item"
            value={newName}
            maxLength={80}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Oxidised pendant"
          />
        </div>
        <Button type="submit" disabled={add.isPending}>
          {add.isPending ? <Loader2 className="animate-spin" /> : <Plus size={16} />} Add
        </Button>
      </form>

      <div className="mt-6 space-y-2">
        {categories.isLoading && <p className="text-sm text-muted-foreground">Loading items...</p>}
        {categories.data?.map((category) => (
          <div
            key={category.id}
            className="panel flex items-center justify-between gap-3 px-4 py-3"
          >
            <span className={category.is_active ? "" : "text-muted-foreground line-through"}>
              {category.name}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggle.mutate(category)}
                aria-label={category.is_active ? `Hide ${category.name}` : `Show ${category.name}`}
              >
                {category.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => remove.mutate(category.id)}
                aria-label={`Remove ${category.name}`}
              >
                <Trash2 size={16} className="text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Link to="/" className="mt-8 inline-block text-sm text-muted-foreground hover:underline">
        ← Back to the review page
      </Link>
    </div>
  );
}
