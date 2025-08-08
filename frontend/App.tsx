import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "./components/Layout";
import { ScriptList } from "./components/ScriptList";
import { ScriptEditor } from "./components/ScriptEditor";
import { ScriptDetail } from "./components/ScriptDetail";
import { ExecutionDetail } from "./components/ExecutionDetail";
import { ScreenshotGallery } from "./components/ScreenshotGallery";
import { AllExecutions } from "./components/AllExecutions";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<ScriptList />} />
            <Route path="/scripts/new" element={<ScriptEditor />} />
            <Route path="/scripts/:id" element={<ScriptDetail />} />
            <Route path="/scripts/:id/edit" element={<ScriptEditor />} />
            <Route path="/executions/:id" element={<ExecutionDetail />} />
            <Route path="/executions" element={<AllExecutions />} />
            <Route path="/screenshots" element={<ScreenshotGallery />} />
          </Routes>
        </Layout>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}
