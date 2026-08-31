import { StudentArtifactPage } from "@/components/research/StudentArtifactPage";

interface PageProps {
  params: Promise<{
    studentId: string;
  }>;
}

export default async function StudentPage({ params }: PageProps) {
  const resolvedParams = await params;
  return <StudentArtifactPage studentId={resolvedParams.studentId} />;
}
