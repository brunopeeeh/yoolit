import React from 'react';
import { Badge } from '@/components/ui/badge';
import packageJson from '../../../package.json';

const ProjectVersion = () => {
  return (
    <div className="flex justify-center py-2">
      <Badge variant="outline" className="text-xs text-muted-foreground">
        v{packageJson.version}
      </Badge>
    </div>
  );
};

export default ProjectVersion;