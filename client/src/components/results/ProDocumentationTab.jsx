// client/src/components/results/ProDocumentationTab.jsx
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BookOpen,
  Network,
  Code2,
  Database,
  Shield,
  Terminal,
  Wrench,
  GitCommit,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'

// ============================================
// SECTION CONFIG
// ============================================
const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'architecture', label: 'Architecture', icon: Network },
  { id: 'api_reference', label: 'API Reference', icon: Code2 },
  { id: 'data_models', label: 'Data Models', icon: Database },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'setup_guide', label: 'Setup Guide', icon: Terminal },
  { id: 'developer_guide', label: 'Developer Guide', icon: Wrench },
  { id: 'changelog_template', label: 'Changelog', icon: GitCommit },
]

// HTTP method badge colors
const METHOD_COLORS = {
  GET: 'bg-green-500/20 text-green-400 border-green-500/30',
  POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PUT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
  PATCH: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

// Severity colors
const SEVERITY_STYLES = {
  high: 'border-red-500/50 bg-red-500/10',
  medium: 'border-amber-500/50 bg-amber-500/10',
  low: 'border-blue-500/50 bg-blue-500/10',
}

// ============================================
// COPY BUTTON COMPONENT
// ============================================
function CopyButton({ text, className = '' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className={`h-7 px-2 text-xs ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 mr-1 text-green-400" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-3 h-3 mr-1" />
          Copy
        </>
      )}
    </Button>
  )
}

// ============================================
// CODE BLOCK COMPONENT
// ============================================
function CodeBlock({ code, language = '', showCopy = true }) {
  return (
    <div className="relative group">
      <pre className="bg-[#0d1117] rounded-lg p-4 overflow-x-auto text-sm font-mono text-gray-300 border border-gray-800">
        <code>{code}</code>
      </pre>
      {showCopy && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton text={code} />
        </div>
      )}
    </div>
  )
}

// ============================================
// PROSE COMPONENT (renders markdown)
// ============================================
function Prose({ content }) {
  if (!content) return null
  
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

// ============================================
// SECTION COMPONENTS
// ============================================

function OverviewSection({ data }) {
  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Summary */}
      {data.summary && (
        <div>
          <h4 className="text-lg font-medium text-white mb-3">Summary</h4>
          <Prose content={data.summary} />
        </div>
      )}

      {/* Purpose */}
      {data.purpose && (
        <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-lg">
          <p className="text-violet-200 font-medium">{data.purpose}</p>
        </div>
      )}

      {/* Tech Stack Table */}
      {data.techStack && data.techStack.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-white mb-3">Tech Stack</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-400">Technology</TableHead>
                <TableHead className="text-gray-400">Version</TableHead>
                <TableHead className="text-gray-400">Purpose</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.techStack.map((tech, i) => (
                <TableRow key={i}>
                  <TableCell className="text-white font-medium">{tech.name}</TableCell>
                  <TableCell className="text-gray-400 font-mono text-sm">{tech.version || 'N/A'}</TableCell>
                  <TableCell className="text-gray-300">{tech.purpose}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Quick Start */}
      {data.quickStart && (
        <div>
          <h4 className="text-lg font-medium text-white mb-3">Quick Start</h4>
          <CodeBlock code={data.quickStart} language="bash" />
        </div>
      )}
    </div>
  )
}

function ArchitectureSection({ data }) {
  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Summary */}
      {data.summary && (
        <div>
          <h4 className="text-lg font-medium text-white mb-3">System Design</h4>
          <Prose content={data.summary} />
        </div>
      )}

      {/* Data Flow */}
      {data.dataFlow && (
        <div>
          <h4 className="text-lg font-medium text-white mb-3">Data Flow</h4>
          <div className="space-y-2">
            {data.dataFlow.split('\n').filter(Boolean).map((step, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 bg-violet-500/20 text-violet-400 rounded-full flex items-center justify-center text-sm font-medium">
                  {i + 1}
                </span>
                <p className="text-gray-300 text-sm">{step.replace(/^\d+\.\s*/, '')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Decisions */}
      {data.keyDecisions && data.keyDecisions.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-white mb-3">Architecture Decision Records</h4>
          <Accordion type="multiple" className="space-y-2">
            {data.keyDecisions.map((decision, i) => (
              <AccordionItem key={i} value={`decision-${i}`} className="border border-gray-800 rounded-lg px-4">
                <AccordionTrigger className="text-white hover:no-underline">
                  <span className="text-left">{decision.decision}</span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-400 space-y-3 pb-4">
                  <div>
                    <span className="text-gray-500 text-sm">Rationale:</span>
                    <p className="text-gray-300 mt-1">{decision.rationale}</p>
                  </div>
                  {decision.tradeoffs && (
                    <div>
                      <span className="text-gray-500 text-sm">Tradeoffs:</span>
                      <p className="text-gray-300 mt-1">{decision.tradeoffs}</p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {/* Diagram Description */}
      {data.diagramDescription && (
        <div>
          <h4 className="text-lg font-medium text-white mb-3">Architecture Diagram</h4>
          <div className="p-4 border-2 border-dashed border-gray-700 rounded-lg bg-gray-800/30">
            <div className="flex items-start gap-3">
              <Network className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{data.diagramDescription}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ApiReferenceSection({ data }) {
  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Base URL & Auth */}
      <div className="flex flex-wrap gap-4">
        {data.baseUrl && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">Base URL:</span>
            <code className="px-2 py-1 bg-gray-800 rounded text-violet-400 text-sm font-mono">
              {data.baseUrl}
            </code>
          </div>
        )}
        {data.authentication && (
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-500" />
            <span className="text-gray-400 text-sm">{data.authentication}</span>
          </div>
        )}
      </div>

      {/* Endpoints */}
      {data.endpoints && data.endpoints.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-white">Endpoints</h4>
          {data.endpoints.map((endpoint, i) => (
            <Card key={i} className="bg-gray-800/50 border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Badge className={`${METHOD_COLORS[endpoint.method] || METHOD_COLORS.GET} font-mono`}>
                    {endpoint.method}
                  </Badge>
                  <code className="text-white font-mono">{endpoint.path}</code>
                </div>
                {endpoint.description && (
                  <CardDescription className="text-gray-400 mt-2">
                    {endpoint.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Parameters */}
                {endpoint.params && endpoint.params.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Parameters</h5>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-gray-500 text-xs">Name</TableHead>
                          <TableHead className="text-gray-500 text-xs">Type</TableHead>
                          <TableHead className="text-gray-500 text-xs">Required</TableHead>
                          <TableHead className="text-gray-500 text-xs">Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {endpoint.params.map((param, j) => (
                          <TableRow key={j}>
                            <TableCell className="font-mono text-violet-400 text-sm">{param.name}</TableCell>
                            <TableCell className="text-gray-400 text-sm">{param.type}</TableCell>
                            <TableCell>
                              {param.required ? (
                                <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-xs">Required</Badge>
                              ) : (
                                <span className="text-gray-500 text-xs">Optional</span>
                              )}
                            </TableCell>
                            <TableCell className="text-gray-300 text-sm">{param.description}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Response */}
                {endpoint.response && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Response</h5>
                    <CodeBlock code={endpoint.response} language="json" />
                  </div>
                )}

                {/* Example */}
                {endpoint.example && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Example</h5>
                    <CodeBlock code={endpoint.example} language="bash" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function DataModelsSection({ data }) {
  if (!data?.models || data.models.length === 0) return null

  return (
    <div className="space-y-4">
      {data.models.map((model, i) => (
        <Card key={i} className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-violet-400" />
              {model.name}
            </CardTitle>
            {model.description && (
              <CardDescription>{model.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Fields Table */}
            {model.fields && model.fields.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-500">Field</TableHead>
                    <TableHead className="text-gray-500">Type</TableHead>
                    <TableHead className="text-gray-500">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {model.fields.map((field, j) => (
                    <TableRow key={j}>
                      <TableCell className="font-mono text-violet-400">{field.name}</TableCell>
                      <TableCell className="font-mono text-gray-400 text-sm">{field.type}</TableCell>
                      <TableCell className="text-gray-300">{field.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Relationships */}
            {model.relationships && (
              <div className="p-3 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-400 italic">{model.relationships}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function SecuritySection({ data }) {
  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Auth Model */}
      {data.authModel && (
        <div>
          <h4 className="text-lg font-medium text-white mb-3">Authentication Model</h4>
          <Prose content={data.authModel} />
        </div>
      )}

      {/* Vulnerabilities */}
      {data.vulnerabilities && data.vulnerabilities.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-white mb-3">Identified Vulnerabilities</h4>
          <div className="space-y-3">
            {data.vulnerabilities.map((vuln, i) => {
              const severity = vuln.severity?.toLowerCase() || 'medium'
              return (
                <div 
                  key={i} 
                  className={`p-4 rounded-lg border-l-4 ${SEVERITY_STYLES[severity] || SEVERITY_STYLES.medium}`}
                >
                  <div className="flex items-start gap-3">
                    {severity === 'high' ? (
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    ) : severity === 'medium' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    ) : (
                      <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${
                          severity === 'high' ? 'bg-red-500/20 text-red-400' :
                          severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-gray-300">{vuln.description}</p>
                      {vuln.recommendation && (
                        <p className="text-sm text-gray-400">
                          <span className="font-medium">Recommendation:</span> {vuln.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Best Practices */}
      {data.bestPractices && data.bestPractices.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-white mb-3">Security Best Practices</h4>
          <div className="space-y-2">
            {data.bestPractices.map((practice, i) => (
              <div key={i} className="flex items-start gap-2 text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <span>{practice}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SetupGuideSection({ data }) {
  if (!data) return null

  // Mask sensitive env var examples
  const maskValue = (key, value) => {
    if (!value) return '••••••••'
    if (/key|secret|token|password|api_key/i.test(key)) {
      return '••••••••'
    }
    return value
  }

  return (
    <div className="space-y-6">
      {/* Prerequisites */}
      {data.prerequisites && data.prerequisites.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-white mb-3">Prerequisites</h4>
          <div className="flex flex-wrap gap-2">
            {data.prerequisites.map((prereq, i) => (
              <Badge key={i} variant="outline" className="text-gray-300 border-gray-600 px-3 py-1">
                {prereq.tool} {prereq.version}
                {prereq.installUrl && (
                  <a href={prereq.installUrl} target="_blank" rel="noopener noreferrer" className="ml-1">
                    <ExternalLink className="w-3 h-3 inline" />
                  </a>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Environment Variables */}
      {data.envVars && data.envVars.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-white mb-3">Environment Variables</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-500">Variable</TableHead>
                <TableHead className="text-gray-500">Required</TableHead>
                <TableHead className="text-gray-500">Description</TableHead>
                <TableHead className="text-gray-500">Example</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.envVars.map((envVar, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-violet-400 text-sm">{envVar.key}</TableCell>
                  <TableCell>
                    {envVar.required ? (
                      <Badge className="bg-amber-500/20 text-amber-400 text-xs">Yes</Badge>
                    ) : (
                      <span className="text-gray-500 text-xs">No</span>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-300 text-sm">{envVar.description}</TableCell>
                  <TableCell className="font-mono text-gray-400 text-sm">
                    {maskValue(envVar.key, envVar.example)}
                  </TableCell>
                  <TableCell>
                    <CopyButton text={`${envVar.key}=${envVar.example || ''}`} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Installation Steps */}
      {data.steps && data.steps.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-white mb-3">Installation</h4>
          <div className="bg-[#0d1117] rounded-lg p-4 border border-gray-800">
            <div className="space-y-1 font-mono text-sm">
              {data.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-gray-500 select-none">$</span>
                  <span className="text-gray-300">{step}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-800">
              <CopyButton text={data.steps.join('\n')} />
            </div>
          </div>
        </div>
      )}

      {/* Troubleshooting */}
      {data.troubleshooting && data.troubleshooting.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-white mb-3">Troubleshooting</h4>
          <Accordion type="multiple" className="space-y-2">
            {data.troubleshooting.map((item, i) => (
              <AccordionItem key={i} value={`trouble-${i}`} className="border border-gray-800 rounded-lg px-4">
                <AccordionTrigger className="text-amber-400 hover:no-underline text-left">
                  {item.problem}
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 pb-4">
                  {item.solution}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  )
}

function DeveloperGuideSection({ data }) {
  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Conventions */}
      {data.conventions && data.conventions.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-white mb-3">Code Conventions</h4>
          <ul className="space-y-2">
            {data.conventions.map((conv, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-300">
                <ChevronRight className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                <span>{conv}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Folder Rationale */}
      {data.folderRationale && (
        <div>
          <h4 className="text-lg font-medium text-white mb-3">Folder Structure</h4>
          <Prose content={data.folderRationale} />
        </div>
      )}

      {/* Adding Features */}
      {data.addingFeatures && (
        <div>
          <h4 className="text-lg font-medium text-white mb-3">Adding New Features</h4>
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <Prose content={data.addingFeatures} />
          </div>
        </div>
      )}

      {/* Testing */}
      {data.testingApproach && (
        <div>
          <h4 className="text-lg font-medium text-white mb-3">Testing</h4>
          <Prose content={data.testingApproach} />
        </div>
      )}
    </div>
  )
}

function ChangelogSection({ data }) {
  if (!data) return null

  // Build changelog markdown
  const changelogMd = useMemo(() => {
    let md = `# Changelog\n\n`
    md += `## [${data.version || '1.0.0'}] - ${data.date || new Date().toISOString().split('T')[0]}\n\n`
    
    if (data.added && data.added.length > 0) {
      md += `### Added\n`
      data.added.forEach(item => {
        md += `- ${item}\n`
      })
      md += '\n'
    }
    
    if (data.fixed && data.fixed.length > 0) {
      md += `### Fixed\n`
      data.fixed.forEach(item => {
        md += `- ${item}\n`
      })
      md += '\n'
    }
    
    if (data.security && data.security.length > 0) {
      md += `### Security\n`
      data.security.forEach(item => {
        md += `- ${item}\n`
      })
      md += '\n'
    }
    
    return md
  }, [data])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-white">Generated CHANGELOG.md</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const blob = new Blob([changelogMd], { type: 'text/markdown' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'CHANGELOG.md'
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="border-gray-700 text-gray-300"
        >
          <Copy className="w-3 h-3 mr-1" />
          Download CHANGELOG.md
        </Button>
      </div>
      <CodeBlock code={changelogMd} language="markdown" />
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function ProDocumentationTab({ sections }) {
  const [activeSection, setActiveSection] = useState('overview')
  const sectionRefs = useRef({})
  const contentRef = useRef(null)

  // Set up Intersection Observer for TOC highlighting
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      {
        root: contentRef.current,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0,
      }
    )

    // Observe all section elements
    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [sections])

  // Scroll to section
  const scrollToSection = useCallback((sectionId) => {
    const element = sectionRefs.current[sectionId]
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  if (!sections) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-gray-400">No documentation available</p>
      </div>
    )
  }

  return (
    <div className="flex gap-6">
      {/* Table of Contents Sidebar */}
      <div className="w-[200px] flex-shrink-0">
        <div className="sticky top-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Contents
          </h3>
          <nav className="space-y-1">
            {SECTIONS.map(({ id, label, icon: Icon }) => {
              const hasContent = sections[id]
              return (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  disabled={!hasContent}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors
                    ${activeSection === id 
                      ? 'bg-violet-500/20 text-violet-300 border-l-2 border-violet-500' 
                      : hasContent
                        ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                        : 'text-gray-600 cursor-not-allowed'
                    }
                  `}
                >
                  <img src="/logo.png" alt="AgentLens Logo" className={`w-4 h-4 object-contain ${activeSection === id ? '' : 'opacity-50'}`} />
                  {label}
                </button>
              )
            })}
          </nav>

          {/* Download All Button */}
          <div className="mt-6 pt-4 border-t border-gray-800">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-gray-700 text-gray-300 hover:text-white"
              onClick={() => {
                const blob = new Blob([JSON.stringify(sections, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'documentation.json'
                a.click()
                URL.revokeObjectURL(url)
              }}
            >
              <Copy className="w-3 h-3 mr-1" />
              Export JSON
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div ref={contentRef} className="flex-1 space-y-12 pb-16 overflow-auto">
        {/* Overview */}
        <section id="overview" ref={(el) => (sectionRefs.current.overview = el)}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-violet-500/20 rounded-lg">
              <BookOpen className="w-5 h-5 text-violet-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Overview</h2>
          </div>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <OverviewSection data={sections.overview} />
            </CardContent>
          </Card>
        </section>

        {/* Architecture */}
        <section id="architecture" ref={(el) => (sectionRefs.current.architecture = el)}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Network className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Architecture</h2>
          </div>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <ArchitectureSection data={sections.architecture} />
            </CardContent>
          </Card>
        </section>

        {/* API Reference */}
        <section id="api_reference" ref={(el) => (sectionRefs.current.api_reference = el)}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Code2 className="w-5 h-5 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">API Reference</h2>
          </div>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <ApiReferenceSection data={sections.api_reference} />
            </CardContent>
          </Card>
        </section>

        {/* Data Models */}
        <section id="data_models" ref={(el) => (sectionRefs.current.data_models = el)}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Database className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Data Models</h2>
          </div>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <DataModelsSection data={sections.data_models} />
            </CardContent>
          </Card>
        </section>

        {/* Security */}
        <section id="security" ref={(el) => (sectionRefs.current.security = el)}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Security</h2>
          </div>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <SecuritySection data={sections.security} />
            </CardContent>
          </Card>
        </section>

        {/* Setup Guide */}
        <section id="setup_guide" ref={(el) => (sectionRefs.current.setup_guide = el)}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Terminal className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Setup Guide</h2>
          </div>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <SetupGuideSection data={sections.setup_guide} />
            </CardContent>
          </Card>
        </section>

        {/* Developer Guide */}
        <section id="developer_guide" ref={(el) => (sectionRefs.current.developer_guide = el)}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Wrench className="w-5 h-5 text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Developer Guide</h2>
          </div>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <DeveloperGuideSection data={sections.developer_guide} />
            </CardContent>
          </Card>
        </section>

        {/* Changelog */}
        <section id="changelog_template" ref={(el) => (sectionRefs.current.changelog_template = el)}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <GitCommit className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Changelog Template</h2>
          </div>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <ChangelogSection data={sections.changelog_template} />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}