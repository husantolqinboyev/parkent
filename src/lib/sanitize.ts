// Input sanitization utilities for XSS protection

/**
 * Sanitize a string input by removing potentially dangerous HTML/script content
 */
export const sanitizeString = (input: string): string => {
  if (!input || typeof input !== "string") return "";
  
  // Remove HTML tags and decode entities
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
};

/**
 * Sanitize a string for display (escape HTML entities)
 */
export const escapeHtml = (input: string): string => {
  if (!input || typeof input !== "string") return "";
  
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
};

/**
 * Validate and sanitize a price input
 */
export const sanitizePrice = (input: string): number => {
  const cleaned = input.replace(/[^0-9]/g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) || num < 0 ? 0 : num;
};

/**
 * Validate title input (max length, no special chars)
 */
export const validateTitle = (title: string): { valid: boolean; error?: string } => {
  const cleaned = sanitizeString(title);
  
  if (!cleaned || cleaned.length < 3) {
    return { valid: false, error: "Sarlavha kamida 3 ta belgidan iborat bo'lishi kerak" };
  }
  
  if (cleaned.length > 200) {
    return { valid: false, error: "Sarlavha 200 ta belgidan oshmasligi kerak" };
  }
  
  return { valid: true };
};

/**
 * Validate description input
 */
export const validateDescription = (desc: string): { valid: boolean; error?: string } => {
  if (!desc) return { valid: true }; // Optional field
  
  const cleaned = sanitizeString(desc);
  
  if (cleaned.length > 5000) {
    return { valid: false, error: "Tavsif 5000 ta belgidan oshmasligi kerak" };
  }
  
  return { valid: true };
};

/**
 * Validate location input
 */
export const validateLocation = (loc: string): { valid: boolean; error?: string } => {
  if (!loc) return { valid: true }; // Optional field
  
  const cleaned = sanitizeString(loc);
  
  if (cleaned.length > 100) {
    return { valid: false, error: "Joylashuv 100 ta belgidan oshmasligi kerak" };
  }
  
  return { valid: true };
};

/**
 * Sanitize form data before submission
 */
export const sanitizeListingForm = (formData: {
  title: string;
  description: string;
  location: string;
  price: string;
}): {
  title: string;
  description: string;
  location: string;
  price: number;
} => {
  return {
    title: sanitizeString(formData.title).slice(0, 200),
    description: sanitizeString(formData.description).slice(0, 5000),
    location: sanitizeString(formData.location).slice(0, 100),
    price: sanitizePrice(formData.price),
  };
};
