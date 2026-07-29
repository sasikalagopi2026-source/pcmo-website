import { Link } from "react-router-dom";
import { Edit, MapPin, Building2, Mail, Phone, Calendar, Globe } from "lucide-react";

export type ProfileData = {
  email: string;
  display_name?: string | null;
  company?: string | null;
  member_number?: string | null;
  status?: string | null;
  role?: string | null;
  phone?: string | null;
  location?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
};

const ProfileCard = ({ profile }: { profile: ProfileData }) => {
  const name = profile.display_name || profile.email;
  const avatar = profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a3a6b&color=fff&size=128&rounded=true&bold=true`;
  const joined = profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "Not available";
  return (
  <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
    <div className="flex flex-col md:flex-row gap-6">
      {/* Profile image + name */}
      <div className="flex items-start gap-4">
        <img
          src={avatar}
          alt={name}
          className="w-20 h-20 rounded-2xl object-cover border-2 border-primary/20 flex-shrink-0"
        />
        <div>
          <h2 className="font-heading font-bold text-lg text-foreground">{name}</h2>
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mt-1">
            <Building2 className="w-3 h-3" />
            <span>{profile.company || "Company not set"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mt-0.5">
            <MapPin className="w-3 h-3" />
            <span>Member ID: {profile.member_number || "Pending"}</span>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="px-2.5 py-1 rounded-lg bg-success/10 text-success text-xs font-semibold">{profile.status || "Active"}</span>
            <span className="px-2.5 py-1 rounded-lg bg-info/10 text-info text-xs font-semibold">{profile.role || "Student"}</span>
          </div>
        </div>
      </div>

      {/* Account details */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 md:border-l md:border-border md:pl-6">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Email</p>
            <p className="text-sm text-foreground">{profile.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Phone</p>
            <p className="text-sm text-foreground">{profile.phone || "Not set"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Joined</p>
            <p className="text-sm text-foreground">{joined}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Location</p>
            <p className="text-sm text-foreground">{profile.location || "Not set"}</p>
          </div>
        </div>
      </div>
    </div>

    <div className="mt-4 pt-4 border-t border-border flex items-center justify-end">
      <Link
        to="/edit-profile"
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
      >
        <Edit className="w-3 h-3" /> Edit Profile
      </Link>
    </div>
  </div>
  );
};

export default ProfileCard;
