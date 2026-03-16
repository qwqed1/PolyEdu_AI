import GenericSubjectLab from './GenericSubjectLab';
import GeographyLab from './GeographyLab';
import LanguageLab from './LanguageLab';
import MathLab from './MathLab';

/**
 * @typedef {Object} ToolAdapterProps
 * @property {import('../../data/labCatalog').LabSubjectConfig} subject
 * @property {'ru' | 'kk'} language
 * @property {string} selectedTool
 */

/**
 * @typedef {Object} LabToolConfig
 * @property {string} key
 * @property {React.ComponentType<ToolAdapterProps>} component
 */

/**
 * @typedef {Object} SubjectWorkspaceProps
 * @property {import('../../data/labCatalog').LabSubjectConfig} subject
 * @property {'ru' | 'kk'} language
 * @property {string} selectedTool
 */

/** @type {Record<string, LabToolConfig>} */
export const labToolRegistry = {
  geography: { key: 'geography', component: GeographyLab },
  math: { key: 'math', component: MathLab },
  language: { key: 'language', component: LanguageLab },
  generic: { key: 'generic', component: GenericSubjectLab },
};

export default function SubjectWorkspace({ subject, language, selectedTool }) {
  const adapter = labToolRegistry[subject.adapterKey] || labToolRegistry.generic;
  const Component = adapter.component;

  return <Component subject={subject} language={language} selectedTool={selectedTool} />;
}
