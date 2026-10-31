"use client";

import Link from "next/link";
import { Bell, LayoutDashboard, LogOut, MessageSquare, Settings } from "lucide-react";
import type { Role } from "@prisma/client";
import { Avatar } from "@/components/ui/misc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { signOutAction } from "@/server/auth-actions";

const HOME: Record<Role, string> = { JOB_SEEKER: "/dashboard", EMPLOYER: "/employer", ADMIN: "/admin" };

export function UserMenu({ user }: { user: { name: string; email: string; role: Role } }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full focus-visible:outline-2" aria-label="Account menu">
        <Avatar name={user.name || user.email} size={36} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel className="pb-2">
          <span className="block truncate text-sm font-semibold text-ink">{user.name || "Your account"}</span>
          <span className="block truncate font-normal">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={HOME[user.role]}>
            <LayoutDashboard /> Dashboard
          </Link>
        </DropdownMenuItem>
        {user.role !== "ADMIN" && (
          <DropdownMenuItem asChild>
            <Link href="/messages">
              <MessageSquare /> Messages
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/notifications">
            <Bell /> Notifications
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings /> Account settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOutAction()}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
