/**
 * ClearPress AI - User Menu Component
 * Dropdown menu with user profile info and actions
 */

import { useState } from 'react';
import { ChevronDown, Loader2, LogOut, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface UserMenuProps {
  compact?: boolean;
  className?: string;
}

export function UserMenu({ compact = false, className }: UserMenuProps) {
  const { t } = useLanguage();
  const { profile, signOut, isPRAdmin, isPRStaff, isClientUser } = useAuth();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      await signOut();
      navigate('/auth/login', { replace: true });
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error(t('auth.logoutError'));
      setIsSigningOut(false);
    }
  };

  const handleProfile = () => {
    if (isClientUser) {
      navigate('/client/profile');
    } else {
      navigate('/pr/profile');
    }
  };

  const handleSettings = () => {
    if (isClientUser) {
      navigate('/client/settings');
    } else {
      navigate('/pr/settings');
    }
  };

  const getInitials = (name: string | undefined): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = () => {
    if (isPRAdmin) return { label: 'Admin', variant: 'default' as const };
    if (isPRStaff) return { label: 'Staff', variant: 'secondary' as const };
    if (isClientUser) return { label: 'Client', variant: 'outline' as const };
    return null;
  };

  const roleBadge = getRoleBadge();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'relative h-auto p-2',
            compact ? 'gap-1' : 'w-full justify-start gap-3',
            className
          )}
          title={compact ? t('nav.settings') : undefined}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {getInitials(profile?.name)}
            </AvatarFallback>
          </Avatar>
          {compact && (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          )}
          {!compact && (
            <div className="flex flex-col items-start text-left flex-1">
              <span className="text-sm font-medium truncate max-w-[140px]">
                {profile?.name}
              </span>
              <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                {profile?.email}
              </span>
            </div>
          )}
          {!compact && (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {profile?.email}
            </p>
            {roleBadge && (
              <Badge variant={roleBadge.variant} className="mt-1 w-fit">
                {roleBadge.label}
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>
        {profile?.organization && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
              {profile.organization.name}
            </DropdownMenuLabel>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={handleProfile}>
            <User className="mr-2 h-4 w-4" />
            <span>{t('profile.title')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleSettings}>
            <Settings className="mr-2 h-4 w-4" />
            <span>{t('nav.settings')}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          variant="destructive"
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          <span>{t('auth.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
