import { Suspense } from "react";
import Image from "next/image";
import { AuthTopBar } from "@/features/auth/components/auth-nav";
import { PHOTOS } from "@/features/landing/content";

/** Sign-in screens are split: a photo on the left, the form on the right. Phones get the form only. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <section className="relative hidden overflow-hidden lg:block">
        <Image
          src={PHOTOS.about}
          alt=""
          fill
          priority
          sizes="42vw"
          className="object-cover object-[38%_center]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-black/30"
        />
        <div className="absolute inset-x-0 top-0 p-6">
          <AuthTopBar onPhoto />
        </div>
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-10 text-white">
          <h1 className="max-w-md text-4xl leading-tight font-bold">
            Do one small thing for your community.
          </h1>
          <p className="max-w-md text-lg text-white/85">
            Join groups for the causes you care about, or start one of your own.
          </p>
        </div>
      </section>
      <section className="flex flex-col px-6 py-6 sm:px-10 lg:px-16">
        <div className="lg:hidden">
          <AuthTopBar />
        </div>
        <div className="flex flex-1 items-center py-10">
          <div className="w-full max-w-md">
            <Suspense fallback={null}>{children}</Suspense>
          </div>
        </div>
      </section>
    </div>
  );
}
