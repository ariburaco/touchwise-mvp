/**
 * Company information schema for Firecrawl extraction
 */
export interface CompanyInfo {
  company_name: string;
  industry?: string;
  description?: string;
  website?: string;
  features?: string[];
  benefits?: string[];
  pricing?: string[];
  support?: string[];
  integrations?: string[];
  security?: string[];
  contact_info?: {
    email?: string;
    phone?: string;
    address?: string;
    chat?: string;
    [key: string]: any;
  };
  services_links?: string[];
  case_studies?: string[];
  use_cases?: string[];
  tagline_options?: string[];
  value_proposition?: string;
  rag_passages?: string[];
  sales_one_pager?: string;
  target_audience?: string[];
  description_short?: string;
  demo_video_link?: string;
}

/**
 * Zod-like schema object for Firecrawl extract
 */
export const companyInfoSchema = {
  type: "object",
  properties: {
    company_name: {
      type: "string",
      description: "The official name of the company"
    },
    industry: {
      type: "string",
      description: "Which industry or sector this company is part of"
    },
    description: {
      type: "string",
      description: "A short, jargon-free description of what this company does"
    },
    website: {
      type: "string",
      description: "Company website URL"
    },
    features: {
      type: "array",
      items: { type: "string" },
      description: "Friendly, clear list of main features"
    },
    benefits: {
      type: "array",
      items: { type: "string" },
      description: "Key benefits, practical for users or customers"
    },
    pricing: {
      type: "array",
      items: { type: "string" },
      description: "How the company or product is priced"
    },
    support: {
      type: "array",
      items: { type: "string" },
      description: "Support channels, response times, or helpful support info"
    },
    integrations: {
      type: "array",
      items: { type: "string" },
      description: "What services or tools does this integrate with?"
    },
    security: {
      type: "array",
      items: { type: "string" },
      description: "Security practices or certifications, in non-technical terms"
    },
    contact_info: {
      type: "object",
      description: "Contact info: email, forms, or chat links"
    },
    services_links: {
      type: "array",
      items: { type: "string" },
      description: "Links to service/product pages"
    },
    case_studies: {
      type: "array",
      items: { type: "string" },
      description: "Links or summaries of case studies or customer stories"
    },
    use_cases: {
      type: "array",
      items: { type: "string" },
      description: "Use cases for the company or product"
    },
    tagline_options: {
      type: "array",
      items: { type: "string" },
      description: "Brand tagline options, friendly and clear (e.g. 'Ship updates your clients actually read.')"
    },
    value_proposition: {
      type: "string",
      description: "Short statement of the unique value (e.g. 'Turns GitHub activity into client-friendly progress updates automatically.')"
    },
    rag_passages: {
      type: "array",
      items: { type: "string" },
      description: "Key, clear product passages or selling points"
    },
    sales_one_pager: {
      type: "string",
      description: "A one-paragraph, no-jargon sales summary"
    },
    target_audience: {
      type: "array",
      items: { type: "string" },
      description: "Key target audiences (e.g. Agencies, SaaS teams, PMs, freelancers)"
    },
    description_short: {
      type: "string",
      description: "A very short, friendly product summary"
    },
    demo_video_link: {
      type: "string",
      description: "A link to a demo video"
    }
  },
  required: ["company_name"]
};
