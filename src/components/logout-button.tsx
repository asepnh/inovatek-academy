import { signOut } from "@/actions/auth";

export function LogoutButton() {
  return (
    <form action={signOut}>
      <button type="submit" className="btn-secondary text-sm">
        Sign out
      </button>
    </form>
  );
}
