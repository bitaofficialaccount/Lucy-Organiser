import { useState, useEffect } from "react";
import { Button, Card, Input, PageTransition } from "@/components/ui/modern";
import { useAuthContext } from "@/contexts/AuthContext";
import { useUpdateProfile } from "@/hooks/use-tasks-reminders";
import { useToast } from "@/hooks/use-toast";
import { Phone, User, Shield, ShieldAlert } from "lucide-react";

export default function Profile() {
  const { user } = useAuthContext();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (user?.phone) setPhone(user.phone);
  }, [user]);

  if (!user) return null;

  const handleSavePhone = () => {
    updateProfile.mutate(
      { phone },
      {
        onSuccess: () => {
          toast({
            title: "Saved!",
            description: "Phone number updated. Your kids' home screen will show this if they're lost.",
          });
        },
      }
    );
  };

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">Profile</h1>
          <p className="text-gray-600">Manage your account & family safety info</p>
        </div>

        {/* Account Card */}
        <Card className="mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-sm"
              style={{ backgroundColor: user.color || "#3B82F6" }}
            >
              {user.username[0].toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">{user.username}</p>
              <p className="text-sm text-gray-500 capitalize">{user.role} account</p>
            </div>
          </div>
        </Card>

        {/* Parent: Emergency Phone */}
        {user.role === "parent" && (
          <Card className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="text-orange-500" size={22} />
              <h2 className="font-bold text-gray-900">Emergency Phone Number</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              This number will appear on your kids' home screen with an "If Lost" message,
              so they (or anyone helping them) can call you.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. (555) 123-4567"
                  className="!pl-10"
                  data-testid="input-phone"
                />
              </div>
              <Button
                variant="primary"
                onClick={handleSavePhone}
                disabled={updateProfile.isPending}
                data-testid="button-save-phone"
              >
                {updateProfile.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
            {user.phone && (
              <p className="text-xs text-green-600 font-semibold mt-2">
                ✓ Currently saved: {user.phone}
              </p>
            )}
          </Card>
        )}

        {/* Kid: Show family safety info */}
        {user.role === "kid" && (
          <Card className="mb-4 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="text-blue-600" size={22} />
              <h2 className="font-bold text-gray-900">Safety Info</h2>
            </div>
            <p className="text-sm text-gray-700">
              If you ever feel lost or scared, your home screen shows your parent's phone
              number so anyone helping you can call them.
            </p>
          </Card>
        )}

        <Card>
          <h2 className="font-bold text-gray-900 mb-2">About Lucy Organiser</h2>
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-semibold text-yellow-500">Lucy</span>
            <span className="font-semibold text-blue-600"> Organiser</span> — Open-Source Family Organising
          </p>
          <p className="text-xs text-gray-500">A safe, simple way for families to share, plan, and stay in touch.</p>
        </Card>
      </div>
    </PageTransition>
  );
}
