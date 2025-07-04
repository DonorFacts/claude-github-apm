/**
 * Path Translation Utility
 * Translates container paths to host paths
 */

import * as path from 'path';

export class PathTranslator {
  constructor(private readonly projectRoot: string) {}
  
  /**
   * Translate a container path to a host path
   */
  translate(containerPath: string): string {
    if (containerPath.startsWith('/workspace/main')) {
      return this.projectRoot + containerPath.substring('/workspace/main'.length);
    } else if (containerPath.startsWith('/workspace/worktrees/')) {
      const worktreeName = containerPath.substring('/workspace/worktrees/'.length);
      const projectDir = path.dirname(this.projectRoot);
      return path.join(projectDir, 'worktrees', worktreeName);
    } else if (containerPath.startsWith('/workspace')) {
      return this.projectRoot + containerPath.substring('/workspace'.length);
    }
    return containerPath;
  }
}