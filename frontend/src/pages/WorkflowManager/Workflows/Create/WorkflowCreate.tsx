import { SectionHeading } from '@/components/Headings/SectionHeading';

import { Card, CardContent } from '@/components/ui/card';
import SchedulerFlowV2 from './SchedulerFlow/SchedulerFlowV2';

const TaskConnector = () => {
  return (
    <div className="grid gap-6 px-4 sm:px-6 lg:px-8 py-4 max-w-screen-2xl mx-auto ">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <SectionHeading
          title="Add Workflow"
          description="Add workflows and their related information in the form."
          showBackButton={true}
        />
      </div>
      <Card className="mx-4">
        <CardContent className="grid gap-6">
          <div className="mt-0 h-auto">
            <SchedulerFlowV2 />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskConnector;
