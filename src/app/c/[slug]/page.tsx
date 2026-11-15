import { withStore } from "@/lib/database";
export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { store, VentureStore } from "@/lib/store";
import { getTemplate } from "@/lib/templates";
import CustomerChatView from "@/components/chat/CustomerChatView";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CustomerChatPage({ params }: PageProps) {
  const { slug } = await params;
  const demo = ["luxe-salon","apex-institute","care-clinic","roastery-cafe"].includes(slug);
  const business = demo ? new VentureStore().getBusiness(slug) : await withStore(async () => store.getBusiness(slug), true);

  if (!business) {
    notFound();
  }

  const template = getTemplate(business.templateType);

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col justify-center">
      <CustomerChatView business={business} template={template} demo={demo} />
    </main>
  );
}
