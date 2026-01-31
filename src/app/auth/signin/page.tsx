"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cruit</h1>
          <p className="text-gray-600">AI 기반 맞춤형 취업 공고 추천</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error === "OAuthSignin" && "로그인 중 오류가 발생했습니다."}
            {error === "OAuthCallback" && "인증 처리 중 오류가 발생했습니다."}
            {error === "OAuthCreateAccount" && "계정 생성 중 오류가 발생했습니다."}
            {error === "Callback" && "콜백 처리 중 오류가 발생했습니다."}
            {error === "Default" && "알 수 없는 오류가 발생했습니다."}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => signIn("kakao", { callbackUrl })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-medium rounded-lg transition-colors"
          >
            <svg
              width="24"
              height="24"
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
            카카오로 시작하기
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-gray-500">
          로그인하면{" "}
          <a href="#" className="underline hover:text-gray-700">
            이용약관
          </a>{" "}
          및{" "}
          <a href="#" className="underline hover:text-gray-700">
            개인정보처리방침
          </a>
          에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩중...</div>}>
      <SignInContent />
    </Suspense>
  );
}
