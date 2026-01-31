"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
        <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || "프로필"}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {session.user.name?.[0] || "U"}
            </div>
          )}
          <span className="text-sm text-gray-700 hidden sm:inline">
            {session.user.name}
          </span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("kakao")}
      className="flex items-center gap-2 px-4 py-2 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] text-sm font-medium rounded-lg transition-colors"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 4C7.02944 4 3 7.16393 3 11.0909C3 13.5907 4.55511 15.7907 6.94628 17.0698L5.73199 21.0513C5.64503 21.3413 5.97889 21.5744 6.23061 21.4042L10.9259 18.3052C11.2776 18.3415 11.6354 18.3636 12 18.3636C16.9706 18.3636 21 15.0179 21 11.0909C21 7.16393 16.9706 4 12 4Z"
          fill="#191919"
        />
      </svg>
      로그인
    </button>
  );
}
