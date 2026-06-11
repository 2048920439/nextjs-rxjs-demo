import { PropsWithChildren } from "react";

import { BasicServiceProvider } from "@/app/(pages)/_components/basic-service-provider";
import { ReactScanInit } from "@/app/(pages)/_components/react-scan";
import { getCurrentUser } from "@/lib/auth";

export default async function PageLayout({ children }: PropsWithChildren) {
  const user = await getCurrentUser();

  return (
    <>
      <ReactScanInit />
      <BasicServiceProvider initUser={user}>{children}</BasicServiceProvider>
    </>
  );
}
