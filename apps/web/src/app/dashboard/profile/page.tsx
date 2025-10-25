'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Mail,
  Globe,
  MapPin,
  Calendar,
  Camera,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { session, refetchSession } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    bio: '',
    location: '',
    website: '',
    phone: '',
  });

  const getUserInitials = (name: string | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement actual profile update API call
      // For now, just show a success message
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast.success('Profile updated successfully');
      setIsEditing(false);
      refetchSession();
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original values
    setFormData({
      name: session?.user?.name || '',
      email: session?.user?.email || '',
      bio: '',
      location: '',
      website: '',
      phone: '',
    });
  };

  const handleAvatarChange = () => {
    // TODO: Implement avatar upload
    toast.info('Avatar upload feature coming soon');
  };

  const memberSince = session?.user?.createdAt
    ? new Date(session.user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Unknown';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal information
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your profile details and public information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={session?.user?.image || undefined} />
                  <AvatarFallback className="text-2xl">
                    {getUserInitials(session?.user?.name)}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 rounded-full"
                    onClick={handleAvatarChange}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Member since {memberSince}
              </Badge>
            </div>

            {/* Form Section */}
            <div className="flex-1 space-y-4">
              {isEditing ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          disabled
                          className="pr-10"
                        />
                        <Mail className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <div className="relative">
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              location: e.target.value,
                            })
                          }
                          placeholder="San Francisco, CA"
                          className="pl-10"
                        />
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <div className="relative">
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              website: e.target.value,
                            })
                          }
                          placeholder="https://example.com"
                          className="pl-10"
                        />
                        <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-semibold">
                      {session?.user?.name || 'User'}
                    </h2>
                    <p className="text-muted-foreground flex items-center gap-1 mt-1">
                      <Mail className="h-4 w-4" />
                      {session?.user?.email}
                    </p>
                  </div>
                  
                  {formData.bio && (
                    <div>
                      <p className="text-sm font-medium mb-1">Bio</p>
                      <p className="text-sm text-muted-foreground">
                        {formData.bio}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm">
                    {formData.location && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {formData.location}
                      </div>
                    )}
                    {formData.website && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        <a
                          href={formData.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {formData.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    <User className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your account details and verification status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium">User ID</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {session?.user?.id || 'Unknown'}
              </code>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium">Email Verified</span>
              <Badge variant={session?.user?.emailVerified ? 'default' : 'secondary'}>
                {session?.user?.emailVerified ? 'Verified' : 'Not Verified'}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium">Two-Factor Authentication</span>
              <Badge variant={(session?.user as any)?.twoFactorEnabled ? 'default' : 'secondary'}>
                {(session?.user as any)?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}