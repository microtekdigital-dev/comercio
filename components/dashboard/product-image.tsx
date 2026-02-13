"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductImageProps {
  imageUrl: string | null | undefined;
  productName: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
}

/**
 * Validates if an image URL is valid and non-empty
 * @param url - The image URL to validate
 * @returns true if the URL is valid, false otherwise
 */
function isValidImageUrl(url: string | null | undefined): boolean {
  // Handle null/undefined
  if (!url) return false;
  
  // Handle non-string types
  if (typeof url !== 'string') return false;
  
  // Handle empty or whitespace-only strings
  if (url.trim() === '') return false;
  
  return true;
}

/**
 * ProductImage component that displays product images with automatic placeholder fallback
 * 
 * Features:
 * - Automatically detects missing or invalid image URLs
 * - Shows placeholder image when product has no image
 * - Handles image loading errors gracefully
 * - Supports all Next.js Image component props
 * 
 * @example
 * ```tsx
 * <ProductImage 
 *   imageUrl={product.image_url} 
 *   productName={product.name}
 *   fill
 *   className="object-cover"
 *   sizes="(max-width: 768px) 100vw, 33vw"
 * />
 * ```
 */
export function ProductImage({
  imageUrl,
  productName,
  className,
  sizes,
  priority = false,
  fill = false,
  width,
  height,
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);
  
  // Determine if we should show the placeholder
  const shouldShowPlaceholder = !isValidImageUrl(imageUrl) || hasError;
  
  // Common props for both placeholder and actual image
  const imageProps = {
    className,
    sizes,
    priority,
    fill,
    width,
    height,
  };
  
  if (shouldShowPlaceholder) {
    return (
      <Image
        src="/placeholder.jpg"
        alt="Sin imagen"
        {...imageProps}
      />
    );
  }
  
  return (
    <Image
      src={imageUrl!}
      alt={productName}
      onError={() => setHasError(true)}
      {...imageProps}
    />
  );
}

// Export the validation function for testing purposes
export { isValidImageUrl };
