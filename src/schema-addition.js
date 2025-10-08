// Structured Data Addition for Faith Defenders SEO
// Adds missing JSON-LD schema to complete 100% SEO implementation

export function generateStructuredData(seoData, baseUrl, canonicalUrl, fullTitle, ogImageUrl) {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      // Enhanced Organization Schema
      {
        "@type": "Organization",
        "@id": `${baseUrl}#organization`,
        "name": "Faith Defenders",
        "url": baseUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/static/images/logo.png`,
          "width": 400,
          "height": 400
        },
        "description": "Defending and sharing the Christian faith through articles, resources, and community.",
        "sameAs": [
          "https://x.com/FaithDefenders",
          "https://facebook.com/FaithDefenders"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+1-555-123-4567",
          "contactType": "customer service",
          "areaServed": "Worldwide",
          "availableLanguage": "English"
        },
        "foundingDate": "2025",
        "knowsAbout": [
          "Christian Faith",
          "Bible Study",
          "Gospel",
          "Christian Ministry",
          "Spiritual Growth"
        ]
      },

      // Enhanced Website Schema
      {
        "@type": "WebSite",
        "@id": `${baseUrl}#website`,
        "url": baseUrl,
        "name": "Faith Defenders",
        "description": "Defending and sharing the Christian faith through articles, resources, and community.",
        "publisher": {
          "@id": `${baseUrl}#organization`
        },
        "inLanguage": "en-US",
        "potentialAction": [
          {
            "@type": "ReadAction",
            "target": `${baseUrl}/articles`
          },
          {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": `${baseUrl}/articles?search={search_term_string}`
            },
            "query-input": "required name=search_term_string"
          }
        ]
      },

      // Enhanced WebPage Schema
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        "url": canonicalUrl,
        "name": fullTitle,
        "description": seoData.description,
        "isPartOf": {
          "@id": `${baseUrl}#website`
        },
        "breadcrumb": {
          "@id": `${canonicalUrl}#breadcrumb`
        },
        "primaryImageOfPage": {
          "@type": "ImageObject",
          "url": ogImageUrl,
          "width": 1200,
          "height": 630
        },
        "datePublished": seoData.publishedTime || new Date().toISOString(),
        "dateModified": seoData.publishedTime || new Date().toISOString(),
        "inLanguage": "en-US"
      },

      // BreadcrumbList
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        "name": "Breadcrumb",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": baseUrl
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Articles",
            "item": `${baseUrl}/articles`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": canonicalUrl.includes('articles/') ? "Article" : "Page",
            "item": canonicalUrl
          }
        ]
      }
    ]
  }

  // Add Article-specific schema if this is an article
  if (seoData.type === "article" && seoData.publishedTime) {
    schema["@graph"].push({
      "@type": "Article",
      "@id": `${canonicalUrl}#article`,
      "headline": seoData.title,
      "description": seoData.description,
      "datePublished": seoData.publishedTime,
      "dateModified": seoData.modifiedTime || seoData.publishedTime,
      "author": {
        "@type": "Person",
        "name": seoData.author || "Faith Defenders"
      },
      "publisher": {
        "@id": `${baseUrl}#organization`
      },
      "mainEntityOfPage": {
        "@id": `${canonicalUrl}#webpage`
      },
      "articleSection": seoData.section || "Christian Faith",
      "keywords": seoData.keywords,
      "image": ogImageUrl,
      "wordCount": seoData.description ? seoData.description.split(/\s+/).length : 300,
      "timeRequired": "PT5M",
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": ".article-title, h1, .article-content"
      },
      "about": {
        "@type": "Thing",
        "name": "Christian Faith"
      }
    })
  }

  return schema
}
