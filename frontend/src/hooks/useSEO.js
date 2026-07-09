import { useEffect } from 'react';

/**
 * Custom Hook to update document metadata dynamically.
 * @param {Object} seoConfig
 * @param {string} seoConfig.title - Page title
 * @param {string} seoConfig.description - Page meta description
 * @param {string} seoConfig.keywords - Page meta keywords
 */
export function useSEO({ title, description, keywords }) {
  useEffect(() => {
    // 1. Update Title
    if (title) {
      document.title = title;
    }

    // 2. Update Description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', description);
      } else {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        metaDesc.setAttribute('content', description);
        document.head.appendChild(metaDesc);
      }
    }

    // 3. Update Keywords
    if (keywords) {
      let metaKey = document.querySelector('meta[name="keywords"]');
      if (metaKey) {
        metaKey.setAttribute('content', keywords);
      } else {
        metaKey = document.createElement('meta');
        metaKey.setAttribute('name', 'keywords');
        metaKey.setAttribute('content', keywords);
        document.head.appendChild(metaKey);
      }
    }
  }, [title, description, keywords]);
}
