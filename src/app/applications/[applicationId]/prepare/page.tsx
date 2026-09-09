import { Metadata } from "next";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import QAPreparationContainer from "@/components/qa/QAPreparationContainer";

export const metadata: Metadata = {
  title: "AI Interview Preparation | JobVanta",
  description: "Personalized, role-specific interview preparation and tailored Q&A.",
};

export default async function ApplicationQAPreparePage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 lg:p-12 pb-24 lg:pb-12">
        <QAPreparationContainer applicationId={applicationId} />
      </div>
    </DashboardLayout>
  );
}
