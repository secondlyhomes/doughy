// app/(tabs)/pipeline/portfolio/add.tsx
// Redirect - portfolio add is now handled via sheet in PipelineScreen
import { Redirect } from 'expo-router';

export default function AddPortfolioPropertyScreen() {
  // Portfolio add is now shown as a sheet directly from PipelineScreen
  // Redirect back to pipeline if someone navigates here directly
  return <Redirect href="/(tabs)/pipeline" />;
}
