"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Nav() {
  const { data: session } = useSession();

  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-stone-800 hover:text-amber-700 transition-colors">
          Family Recipes
        </Link>

        <div className="flex items-center gap-3">
          {session && (
            <>
              <Link
                href="/import"
                className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                + Import
              </Link>
              <span className="text-sm text-stone-500 hidden sm:inline">
                {session.user?.name}
              </span>
              <button
                onClick={() => signOut()}
                className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
