import { BioCard, ContactForm, ProjectGrid, SkillTags } from './PortfolioBlocks.jsx'

export function TemplateSwitcher({ value, onChange }) {
  return (
    <div className="template-switcher" role="radiogroup" aria-label="Portfolio layout">
      <button type="button" role="radio" aria-checked={value === 'canvas'} className={value === 'canvas' ? 'is-selected' : ''} onClick={() => onChange('canvas')}>Canvas <span>A</span></button>
      <button type="button" role="radio" aria-checked={value === 'index'} className={value === 'index' ? 'is-selected' : ''} onClick={() => onChange('index')}>Index <span>B</span></button>
    </div>
  )
}

export function TemplateA(props) {
  return (
    <div className="portfolio-template template-canvas">
      <BioCard {...props} />
      <ProjectGrid {...props} projects={props.profile.projects} />
      <SkillTags {...props} skills={props.profile.skills} />
      <ContactForm />
    </div>
  )
}

export function TemplateB(props) {
  return (
    <div className="portfolio-template template-index">
      <div className="index-sidebar"><BioCard {...props} /><SkillTags {...props} skills={props.profile.skills} /></div>
      <div className="index-main"><ProjectGrid {...props} projects={props.profile.projects} /><ContactForm /></div>
    </div>
  )
}