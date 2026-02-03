import { Button } from '@/components/ui/button';

type Props = {
  onAddTask: () => void;
  onGenerate: () => void;
};

export default function WorkflowControls({ onAddTask, onGenerate }: Props) {
  return (
    <div className="p-4 flex gap-4">
      <Button onClick={onAddTask}>Add Root Task</Button>
      <Button variant="outline" onClick={onGenerate}>
        Generate Payload
      </Button>
    </div>
  );
}
