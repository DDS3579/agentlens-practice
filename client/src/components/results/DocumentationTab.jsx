import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import useAgentStore from '../../store/agentStore.js';

const DocumentationTab = () => {
  const { documentation, documentationMeta, repoSummary, bugs } = useAgentStore();
  const [viewMode, setViewMode] = useState('rendered');
  const [copied, setCopied] = useState(false);
  const contentRef = useRef(null);

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(documentation || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const repoName = repoSummary?.repo || 'project';
    const blob = new Blob([documentation || ''], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${repoName}-docs.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const markdownComponents = {
    h1: ({ children }) => (
      <h1 className="text-3xl font-bold text-white border-b border-[#2d3748] pb-4 mb-6 mt-8 first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }) => {
      const id = children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      return (
        <h2 id={id} className="text-2xl font-semibold text-white border-l-4 border-indigo-500 pl-4 mt-10 mb-4">
          {children}
        </h2>
      );
    },
    h3: ({ children }) => (
      <h3 className="text-xl font-medium text-white mt-6 mb-3">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="text-[#94a3b8] leading-[1.7] mb-4">
        {children}
      </p>
    ),
    code: ({ inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : 'text';
      
      if (!inline) {
        return (
          <div className="relative my-4">
            <div className="absolute top-0 right-0 bg-[#1a1d2e] text-gray-400 text-xs px-2 py-1 rounded-bl">
              {language}
            </div>
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={language}
              PreTag="div"
              className="rounded-lg !bg-[#0f1117] !mt-0"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          </div>
        );
      }
      
      return (
        <code className="bg-[#0f1117] text-[#a78bfa] px-1.5 py-0.5 rounded font-mono text-sm" {...props}>
          {children}
        </code>
      );
    },
    ul: ({ children }) => (
      <ul className="text-[#94a3b8] list-disc list-inside mb-4 ml-4 space-y-1">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="text-[#94a3b8] list-decimal list-inside mb-4 ml-4 space-y-1">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="mb-1 leading-relaxed">
        {children}
      </li>
    ),
    strong: ({ children }) => (
      <strong className="text-white font-semibold">
        {children}
      </strong>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-[#6366f1] bg-[#1a1d2e] px-4 py-3 my-4 italic text-gray-400">
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto my-4">
        <table className="w-full border-collapse">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-[#1a1d2e]">
        {children}
      </thead>
    ),
    th: ({ children }) => (
      <th className="bg-[#1a1d2e] text-white font-semibold px-4 py-2 border border-[#2d3748] text-left">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-2 border border-[#2d3748] text-gray-400">
        {children}
      </td>
    ),
    a: ({ children, href }) => (
      <a href={href} className="text-indigo-400 hover:text-indigo-300 underline" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
    hr: () => (
      <hr className="border-[#2d3748] my-8" />
    ),
  };

  if (!documentation) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">📝</div>
        <h3 className="text-xl font-semibold text-white mb-2">Documentation not yet generated</h3>
        <p className="text-gray-400">Run an analysis to generate documentation</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span>📄</span> Generated Documentation
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Generated by Technical Writer Agent • Incorporates security findings
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {documentationMeta?.wordCount && (
            <span className="bg-[#1a1d2e] text-gray-300 px-3 py-1 rounded-full text-sm border border-[#2d3748]">
              ~{documentationMeta.wordCount.toLocaleString()} words
            </span>
          )}
          {documentationMeta?.coverageScore !== undefined && (
            <span className="bg-[#1a1d2e] text-gray-300 px-3 py-1 rounded-full text-sm border border-[#2d3748]">
              Coverage: {documentationMeta.coverageScore}%
            </span>
          )}
          <button
            onClick={handleCopyMarkdown}
            className="bg-[#1a1d2e] hover:bg-[#252a3e] text-gray-300 px-4 py-2 rounded-lg text-sm border border-[#2d3748] transition-colors flex items-center gap-2"
          >
            {copied ? '✓ Copied!' : 'Copy Markdown'}
          </button>
          <button
            onClick={handleDownload}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            Download .md
          </button>
        </div>
      </div>

      {/* Sections Quick Nav */}
      {documentationMeta?.sections && documentationMeta.sections.length > 0 && (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-2">
            {documentationMeta.sections.map((section, index) => {
              const sectionId = section.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
              return (
                <button
                  key={index}
                  onClick={() => scrollToSection(sectionId)}
                  className="bg-[#1a1d2e] hover:bg-indigo-600 text-gray-300 hover:text-white px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors border border-[#2d3748] hover:border-indigo-600"
                >
                  {section}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setViewMode('rendered')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'rendered'
              ? 'bg-indigo-600 text-white'
              : 'bg-[#1a1d2e] text-gray-300 hover:bg-[#252a3e] border border-[#2d3748]'
          }`}
        >
          Rendered
        </button>
        <button
          onClick={() => setViewMode('raw')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'raw'
              ? 'bg-indigo-600 text-white'
              : 'bg-[#1a1d2e] text-gray-300 hover:bg-[#252a3e] border border-[#2d3748]'
          }`}
        >
          Raw Markdown
        </button>
      </div>

      {/* Main Content */}
      <div
        ref={contentRef}
        className="bg-[#1a1d2e] border border-[#2d3748] rounded-lg p-6 md:p-8 min-h-[400px]"
      >
        {viewMode === 'rendered' ? (
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {documentation}
            </ReactMarkdown>
          </div>
        ) : (
          <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap break-words bg-[#0f1117] p-4 rounded-lg overflow-x-auto">
            {documentation}
          </pre>
        )}
      </div>

      {/* Known Issues Highlight */}
      {bugs && bugs.length > 0 && (
        <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-4 flex items-start gap-3">
          <span className="text-xl">ℹ️</span>
          <p className="text-indigo-200 text-sm">
            This documentation includes a Known Issues section with{' '}
            <span className="font-semibold text-white">{bugs.length} security finding{bugs.length !== 1 ? 's' : ''}</span>{' '}
            identified by the Security Specialist Agent.
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentationTab;
