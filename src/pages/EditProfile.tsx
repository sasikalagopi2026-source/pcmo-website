import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { api, getToken } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Profile = {
  display_name: string; headline?: string; bio?: string; company?: string;
  phone?: string; location?: string; avatar_url?: string; cover_url?: string;
};

const EditProfile = () => {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const profile = useQuery({ queryKey: ["me"], queryFn: () => api<Profile>("/api/auth/me") });
  const [form, setForm] = useState<Profile>({ display_name: "" });
  const [avatarError, setAvatarError] = useState("");
  useEffect(() => {
    if (profile.data) {
      setForm({
        display_name: profile.data.display_name || "",
        headline: profile.data.headline || "",
        bio: profile.data.bio || "",
        company: profile.data.company || "",
        phone: profile.data.phone || "",
        location: profile.data.location || "",
        avatar_url: profile.data.avatar_url || "",
        cover_url: profile.data.cover_url || "",
      });
    }
  }, [profile.data]);
  const save = useMutation({
    mutationFn: () => api("/api/profile", {
      method: "PUT",
      body: JSON.stringify({
        display_name: form.display_name,
        headline: form.headline || null,
        bio: form.bio || null,
        company: form.company || null,
        phone: form.phone || null,
        location: form.location || null,
        avatar_url: form.avatar_url || null,
        cover_url: form.cover_url || null,
      }),
    }),
    onSuccess: async () => { await refresh(); navigate("/account"); },
  });
  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const data = new FormData();
      data.append("avatar", file);
      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken() ?? ""}` },
        body: data,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Profile image upload failed");
      return payload as { avatar_url: string };
    },
    onMutate: () => setAvatarError(""),
    onSuccess: async ({ avatar_url }) => {
      setForm((current) => ({ ...current, avatar_url }));
      await refresh();
    },
    onError: (error) => setAvatarError(error instanceof Error ? error.message : "Profile image upload failed"),
  });
  const set = (key: keyof Profile, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <h1 className="font-heading text-2xl font-bold">Edit Profile</h1>
        <div className="grid gap-4 rounded-xl border border-border bg-card p-6 sm:grid-cols-2">
          <div className="flex items-center gap-4 sm:col-span-2">
            <img
              src={form.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.display_name || "Member")}&background=1a3a6b&color=fff&size=128&rounded=true&bold=true`}
              alt="Profile preview"
              className="h-24 w-24 rounded-2xl border-2 border-primary/20 object-cover"
            />
            <div className="space-y-2">
              <Label htmlFor="avatar-upload">Profile image</Label>
              <Button asChild type="button" variant="outline" disabled={uploadAvatar.isPending}>
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  <Upload className="h-4 w-4" />
                  {uploadAvatar.isPending ? "Uploading..." : "Upload image"}
                </label>
              </Button>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) uploadAvatar.mutate(file);
                  event.target.value = "";
                }}
              />
              <p className="text-xs text-muted-foreground">JPG, PNG, WebP, or GIF. Maximum 5 MB.</p>
              {avatarError && <p className="text-sm text-destructive">{avatarError}</p>}
              {uploadAvatar.isSuccess && <p className="text-sm text-success">Profile image updated.</p>}
            </div>
          </div>
          {[
            ["display_name", "Display name"], ["headline", "Headline"], ["company", "Company"],
            ["phone", "Phone"], ["location", "Location"], ["cover_url", "Cover URL"],
          ].map(([key, label]) => <label key={key} className="space-y-2"><Label>{label}</Label><Input value={String(form[key as keyof Profile] ?? "")} onChange={(event) => set(key as keyof Profile, event.target.value)} /></label>)}
          <label className="space-y-2 sm:col-span-2"><Label>Bio</Label><Textarea rows={6} value={form.bio ?? ""} onChange={(event) => set("bio", event.target.value)} /></label>
          {save.error && <p className="text-sm text-destructive sm:col-span-2">{save.error.message}</p>}
          <div className="flex gap-2 sm:col-span-2"><Button onClick={() => save.mutate()} disabled={save.isPending}>Save profile</Button><Button variant="outline" onClick={() => navigate("/account")}>Cancel</Button></div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditProfile;
