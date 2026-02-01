"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    Configuration: "서버 설정에 문제가 있습니다.",
    AccessDenied: "접근이 거부되었습니다.",
    Verification: "인증 링크가 만료되었거나 이미 사용되었습니다.",
    OAuthSignin: "OAuth 로그인 중 오류가 발생했습니다.",
    OAuthCallback: "OAuth 콜백 처리 중 오류가 발생했습니다.",
    OAuthCreateAccount: "OAuth 계정 생성 중 오류가 발생했습니다.",
    EmailCreateAccount: "이메일 계정 생성 중 오류가 발생했습니다.",
    Callback: "콜백 처리 중 오류가 발생했습니다.",
    OAuthAccountNotLinked: "다른 로그인 방법으로 이미 가입된 이메일입니다.",
    SessionRequired: "로그인이 필요합니다.",
    Default: "알 수 없는 오류가 발생했습니다.",
  };

  const errorMessage = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">로그인 오류</h1>
        <p className="text-gray-600 mb-6">{errorMessage}</p>

        <div className="space-y-3">
          <Link
            href="/auth/signin"
            className="block w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            다시 로그인하기
          </Link>
          <Link
            href="/"
            className="block w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩중...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
