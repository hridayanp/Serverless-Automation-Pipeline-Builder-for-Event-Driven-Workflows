import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  workflowName: string;
  setWorkflowName: (v: string) => void;
  cron: string;
  setCron: (v: string) => void;
  cronDetail: string;
  setCronDetail: (v: string) => void;
  projectId: string;
  setProjectId: (v: string) => void;
};

export default function WorkflowHeader({
  workflowName,
  setWorkflowName,
  cron,
  setCron,
  cronDetail,
  setCronDetail,
  projectId,
  setProjectId,
}: Props) {
  return (
    <div className="p-4 border-b flex gap-4 items-center">
      <div className="flex flex-col">
        <Label>Workflow Name</Label>
        <Input
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
        />
      </div>

      <div className="flex flex-col">
        <Label>Project ID</Label>
        <Input
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        />
      </div>

      <div className="flex flex-col">
        <Label>CRON</Label>
        <Input value={cron} onChange={(e) => setCron(e.target.value)} />
      </div>

      <div className="flex flex-col">
        <Label>CRON Detail</Label>
        <Input
          value={cronDetail}
          onChange={(e) => setCronDetail(e.target.value)}
        />
      </div>
    </div>
  );
}
