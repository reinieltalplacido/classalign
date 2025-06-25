import Navbar from "@/components/navbar";
import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm text-center">
          <h2 className="text-2xl font-semibold mb-4">Confirm your signup</h2>
          <p className="mb-2">Follow the link sent to your email to confirm your account.</p>
          <p className="mb-6">If you don't see the email, check your spam folder.</p>
          <Link href="/sign-in" className="text-primary font-medium hover:underline transition-all">
            Back to Sign in
          </Link>
        </div>
      </div>
    </>
  );
} 