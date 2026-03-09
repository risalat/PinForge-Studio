import { redirect } from "next/navigation";

type LoginAliasPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function LoginAliasPage({ searchParams }: LoginAliasPageProps) {
  const params = await searchParams;
  const nextPath = params.next ? `?next=${encodeURIComponent(params.next)}` : "";
  redirect(`/${nextPath}`);
}
