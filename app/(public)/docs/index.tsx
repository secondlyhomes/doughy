// app/(public)/docs/index.tsx
// Documentation home - redirects to introduction
import { Redirect } from 'expo-router';

export default function DocsIndex() {
  return <Redirect href="/docs/introduction" />;
}
