import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import type { ProjectContext, AgentDocContext, DomainContext, WorkflowContext } from './types.js';

function safeExec(command: string, cwd: string): { success: boolean; stdout: string } {
  try {
    const stdout = execSync(command, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8',
      timeout: 5000,
    });
    return { success: true, stdout: stdout.trim() };
  } catch {
    return { success: false, stdout: '' };
  }
}

export async function collectProjectContext(targetDir: string): Promise<ProjectContext> {
  const resolvedPath = path.resolve(targetDir);

  if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isDirectory()) {
    return {
      targetPath: resolvedPath,
      files: [],
      agentDoc: {
        hasSkillsSection: false,
      },
      domain: {
        hasGlossary: false,
        adrCount: 0,
      },
      workflow: {
        hasGitRemote: false,
        isGhAuthenticated: false,
        triageLabels: [],
      },
    };
  }

  let entries: string[] = [];
  try {
    entries = fs.readdirSync(resolvedPath);
  } catch {
    entries = [];
  }

  // 1. Inspect Agent Docs
  const agentDoc: AgentDocContext = {
    hasSkillsSection: false,
  };

  const candidateDoc = entries.includes('AGENTS.md')
    ? 'AGENTS.md'
    : entries.includes('CLAUDE.md')
      ? 'CLAUDE.md'
      : undefined;

  if (candidateDoc) {
    try {
      const content = fs.readFileSync(path.join(resolvedPath, candidateDoc), 'utf-8');
      agentDoc.filename = candidateDoc;
      agentDoc.content = content;
      agentDoc.hasSkillsSection = /^##\s+Agent skills/m.test(content);
    } catch {
      // ignore read error
    }
  }

  // 2. Inspect Domain Docs
  const hasGlossary = entries.includes('GLOSSARY.md');
  let adrCount = 0;
  const adrDir = path.join(resolvedPath, 'docs', 'adr');
  if (fs.existsSync(adrDir) && fs.statSync(adrDir).isDirectory()) {
    try {
      const adrFiles = fs.readdirSync(adrDir);
      adrCount = adrFiles.filter((f) => f.endsWith('.md')).length;
    } catch {
      adrCount = 0;
    }
  }

  const domain: DomainContext = {
    hasGlossary,
    adrCount,
  };

  // 3. Inspect Workflow
  const gitRemoteRes = safeExec('git remote get-url origin', resolvedPath);
  const hasGitRemote = gitRemoteRes.success && Boolean(gitRemoteRes.stdout);
  const remoteUrl = hasGitRemote ? gitRemoteRes.stdout : undefined;

  let isGhAuthenticated = false;
  let triageLabels: string[] = [];

  const ghAuthRes = safeExec('gh auth status', resolvedPath);
  if (ghAuthRes.success || ghAuthRes.stdout.includes('Logged in to')) {
    isGhAuthenticated = true;
  }

  if (isGhAuthenticated && hasGitRemote) {
    const labelsRes = safeExec('gh label list --json name --jq .[].name', resolvedPath);
    if (labelsRes.success && labelsRes.stdout) {
      triageLabels = labelsRes.stdout
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
    }
  }

  const workflow: WorkflowContext = {
    hasGitRemote,
    remoteUrl,
    isGhAuthenticated,
    triageLabels,
  };

  return {
    targetPath: resolvedPath,
    files: entries,
    agentDoc,
    domain,
    workflow,
  };
}
