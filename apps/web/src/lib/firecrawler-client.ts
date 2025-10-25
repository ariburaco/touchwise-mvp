const FIRECRAWLER_API_URL = process.env.NEXT_PUBLIC_FIRECRAWLER_URL || 'http://localhost:3002';

export interface CompanyInfo {
  name?: string;
  description?: string;
  industry?: string;
  products?: string[];
  services?: string[];
  targetAudience?: string;
  keyFeatures?: string[];
  benefits?: string[];
  pricing?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

export interface ExtractResponse {
  url: string;
  extractedAt: string;
  data: CompanyInfo;
  metadata: {
    success: boolean;
    warning?: string;
  };
}

export async function extractCompanyInfo(url: string): Promise<ExtractResponse> {
  const response = await fetch(`${FIRECRAWLER_API_URL}/extract?url=${encodeURIComponent(url)}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to extract company information');
  }

  return response.json();
}
