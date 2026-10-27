// Structured data for Google and AI answers. Written as raw JSON so the pre-rendered HTML holds valid JSON
// (React would otherwise escape the quotes), with "<" escaped so text can never close the script tag early.
export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
