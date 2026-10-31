"use client";

import { useActionState, useState, useTransition } from "react";
import { MoreHorizontal, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { AdminRole, Role, UserStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown";
import { Field, Input, Select } from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/forms";
import { ADMIN_ROLE_LABEL } from "@/lib/constants";
import { inviteAdminAction, setAdminRoleAction, setUserStatusAction } from "@/server/admin-actions";

export function UserRowActions({
  user,
  canManageAdmins,
}: {
  user: { id: string; name: string; role: Role; status: UserStatus; adminRole: AdminRole | null };
  canManageAdmins: boolean;
}) {
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const run = (fn: () => Promise<{ error?: string; message?: string }>) =>
    start(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
      else toast.success(res.message ?? "Saved");
      setConfirm(false);
    });
  const suspended = user.status === "SUSPENDED";
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${user.name}`} disabled={pending}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {suspended ? (
            <DropdownMenuItem onSelect={() => run(() => setUserStatusAction(user.id, "ACTIVE"))}>Reactivate account</DropdownMenuItem>
          ) : (
            <DropdownMenuItem destructive onSelect={() => setConfirm(true)}>
              Suspend account
            </DropdownMenuItem>
          )}
          {user.role === "ADMIN" && canManageAdmins && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Admin role</DropdownMenuLabel>
              {(Object.keys(ADMIN_ROLE_LABEL) as AdminRole[])
                .filter((r) => r !== user.adminRole)
                .map((r) => (
                  <DropdownMenuItem key={r} onSelect={() => run(() => setAdminRoleAction(user.id, r))}>
                    Make {ADMIN_ROLE_LABEL[r].toLowerCase()}
                  </DropdownMenuItem>
                ))}
              <DropdownMenuItem destructive onSelect={() => run(() => setAdminRoleAction(user.id, "NONE"))}>
                Revoke admin access
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent title={`Suspend ${user.name}?`} description="They'll be signed out immediately and can't sign in until reactivated. Their data is kept.">
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button variant="danger" loading={pending} onClick={() => run(() => setUserStatusAction(user.id, "SUSPENDED"))}>
              Suspend account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function InviteAdmin() {
  const [state, action] = useActionState(inviteAdminAction, {});
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <UserPlus /> Invite administrator
        </Button>
      </DialogTrigger>
      <DialogContent title="Invite an administrator" description="They'll get an email with a link to set their password. Choose the least access they need.">
        {state.ok ? (
          <FormMessage state={state} />
        ) : (
          <form action={action} className="grid gap-4" noValidate>
            <FormMessage state={{ error: state.error }} />
            <Field label="Name" error={state.fieldErrors?.name}>
              {({ id, invalid }) => <Input id={id} name="name" aria-invalid={invalid} />}
            </Field>
            <Field label="Email" error={state.fieldErrors?.email}>
              {({ id, invalid }) => <Input id={id} name="email" type="email" aria-invalid={invalid} />}
            </Field>
            <Field label="Role" hint="Moderators review companies, jobs and reports. Content editors manage resources, categories and announcements. Support manages users.">
              {({ id, describedBy }) => (
                <Select id={id} name="adminRole" defaultValue="MODERATOR" aria-describedby={describedBy}>
                  {(Object.keys(ADMIN_ROLE_LABEL) as AdminRole[]).map((r) => (
                    <option key={r} value={r}>
                      {ADMIN_ROLE_LABEL[r]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <SubmitButton pendingText="Sending invitation…">Send invitation</SubmitButton>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
