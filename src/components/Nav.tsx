"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import ThemeToggle from "./ThemeToggle";

export default function Nav() {
  const { data: session } = useSession();

  return (
    <nav className="bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-stone-800 dark:text-stone-100 hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
          Family Recipes
        </Link>

        <div className="flex items-center gap-3">
          {session && (
            <>
              <Link
                href="/calendar"
                className="text-sm font-medium text-stone-600 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
              >
                Calendar
              </Link>
              <Link
                href="/import"
                className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                + Import
              </Link>
              <span className="text-sm text-stone-500 dark:text-stone-400 hidden sm:inline">
                {session.user?.name}
              </span>
              <button
                onClick={() => signOut()}
                aria-label="Sign out"
                className="text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M17.4399 14.62L19.9999 12.06L17.4399 9.5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9.76001 12.0601H19.93" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11.76 20C7.34001 20 3.76001 17 3.76001 12C3.76001 7 7.34001 4 11.76 4" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
