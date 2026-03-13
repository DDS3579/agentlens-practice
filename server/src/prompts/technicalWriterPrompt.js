export const WRITER_SYSTEM_PROMPT = `You are a senior technical writer specializing in developer documentation. You write clear, concise, and useful documentation that developers actually want to read.

## Your Documentation Principles

1. **Write for newcomers**: Assume the reader is seeing this codebase for the first time
2. **Be concise**: Developers skim, they don't read paragraphs. Use bullets, tables, and headers
3. **Show, don't tell**: Include working code examples for every function and endpoint
4. **Document the WHY**: Explain intent and design decisions, not just what code does
5. **Be honest**: Document known issues openly—hiding problems erodes trust
6. **Format properly**: Use consistent Markdown with proper headings, code blocks, and formatting

## What You Document

### Project Overview
- What the project does in 1-2 sentences
- Who it's for and what problem it solves
- Key technologies used

### Setup & Installation
- Prerequisites (Node version, dependencies)
- Installation commands
- Environment variables needed
- How to run in development vs production

### API Reference (if applicable)
For each endpoint:
- HTTP method and path
- Request parameters (path, query, body)
- Response format with example
- Error responses
- Authentication requirements

### Functions & Classes
For each key function:
- Purpose (one line)
- Parameters with types
- Return value with type
- Usage example
- Edge cases or gotchas

### Configuration
- Environment variables with descriptions
- Config file options
- Default values

### Known Issues
- List every known bug/vulnerability with severity
- Use badges: 🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Low
- Include workarounds if available

### Usage Examples
- Common use cases with working code
- Copy-pasteable examples
- Expected output

## Markdown Formatting Standards

- Use \`#\` for main title, \`##\` for sections, \`###\` for subsections
- Use \`\`\`language for code blocks with syntax highlighting
- Use tables for parameter documentation
- Use > blockquotes for important notes
- Use - or * for bullet lists
- Use **bold** for emphasis, \`code\` for inline code

You must ALWAYS respond with valid JSON only. No raw markdown outside the JSON structure. The documentation content itself will be a markdown STRING inside the JSON. No code fences around your response.`;

export function buildDocumentationPrompt(files, bugs, coordinatorPlan) {
  const projectType = coordinatorPlan?.projectType || 'software project';
  const writerInstructions = coordinatorPlan?.agentFocusAreas?.writer || 
    'Generate comprehensive documentation covering all major components.';

  // Format files for the prompt
  const filesContent = files.map(f => {
    return `### File: ${f.path} (${f.language})
\`\`\`${f.language}
${f.content}
\`\`\``;
  }).join('\n\n');

  // Format bugs for Known Issues section
  const bugsContent = bugs.length > 0
    ? bugs.map(b => {
        const severityEmoji = {
          critical: '🔴 CRITICAL',
          high: '🟠 HIGH',
          medium: '🟡 MEDIUM',
          low: '🟢 LOW'
        }[b.severity] || '⚪ UNKNOWN';
        return `- **${severityEmoji}**: ${b.title} (${b.file}, line ${b.line}) - ${b.description}`;
      }).join('\n')
    : 'No known issues identified.';

  return `Generate comprehensive developer documentation for this codebase.

## Project Information
- **Project Type**: ${projectType}
- **Files Count**: ${files.length}
- **Known Issues Found**: ${bugs.length}

## Specific Instructions from Coordinator
${writerInstructions}

## Source Code Files
${filesContent}

## Known Issues (from Security Analysis)
Include ALL of these in the Known Issues section:
${bugsContent}

## Your Task
Generate complete documentation and respond with this EXACT JSON structure:

{
  "documentation": "# Project Name\\n\\n## Overview\\n...full markdown documentation string...",
  "sections": ["Overview", "Installation", "Project Structure", "API Reference", "Configuration", "Usage Examples", "Known Issues", "Contributing"],
  "wordCount": 450,
  "coverageScore": 85
}

The "documentation" field must be a complete markdown string with these sections:

1. **# [Project Name]** - Infer a good name from the code
2. **## Overview** - What this project does (2-3 sentences)
3. **## Installation** - Inferred setup steps based on the code (package.json, imports, etc.)
4. **## Project Structure** - Key files and their purpose
5. **## API Reference** or **## Functions** - Document key endpoints/functions with:
   - Description
   - Parameters (in a table if multiple)
   - Return value
   - Example usage
6. **## Configuration** - Environment variables and config options found in code
7. **## Usage Examples** - Working code examples showing common use cases
8. **## Known Issues** - List EVERY bug from the security analysis with severity badges
9. **## Contributing** - Brief contribution guidelines

For "coverageScore":
- 90-100: All functions, endpoints, and configs documented with examples
- 70-89: Most components documented, some examples
- 50-69: Basic documentation, missing some areas
- Below 50: Incomplete documentation

Respond with valid JSON only. No markdown outside the JSON structure, no code fences around your response.`;
}

export function buildRefinementPrompt(currentDocs, specificSection) {
  return `Rewrite and improve a specific section of the existing documentation.

## Current Documentation
\`\`\`markdown
${currentDocs}
\`\`\`

## Section to Rewrite
**${specificSection}**

## Your Task
Rewrite ONLY the "${specificSection}" section to be:
- More detailed and comprehensive
- Better formatted with proper Markdown
- Include more code examples if applicable
- Clearer and more useful for developers

Return the COMPLETE documentation (not just the section) with the improved section integrated.

Respond with this EXACT JSON structure:

{
  "documentation": "# Project Name\\n\\n## Overview\\n...full markdown with improved ${specificSection} section...",
  "sections": ["Overview", "Installation", "Project Structure", "API Reference", "Configuration", "Usage Examples", "Known Issues", "Contributing"],
  "wordCount": 500,
  "coverageScore": 88
}

The documentation should be the FULL document with the "${specificSection}" section rewritten and improved.

Respond with valid JSON only. No markdown outside the JSON structure, no code fences around your response.`;
}
