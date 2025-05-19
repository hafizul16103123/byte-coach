"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import Monaco to prevent SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export default function CodeRunnerPage() {
  const [language, setLanguage] = useState<string>("python");
  const [code, setCode] = useState<string>("print('Hello, world!')");
  const [output, setOutput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunCode = async () => {
    setLoading(true);
    setError(null);
    setOutput("");

    try {
      const response = await fetch("http://localhost:3300/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ language, code }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const result = await response.json();
      setOutput(result.output || "No output returned.");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Map to Monaco-supported language IDs
  const getMonacoLang = (lang: string): string => {
    switch (lang) {
      case "python":
        return "python";
      case "node":
        return "javascript";
      case "go":
        return "go";
      case "cpp":
        return "cpp";
      default:
        return "plaintext";
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 text-gray-800">
      <h1 className="text-3xl font-semibold mb-4">Multi-language Code Runner</h1>

      <div className="mb-4">
        <label htmlFor="language" className="block font-medium mb-1">
          Select Language:
        </label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="border p-2 rounded w-48"
        >
          <option value="python">Python</option>
          <option value="node">Node.js</option>
          <option value="go">Go</option>
          <option value="cpp">C++</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">Code Editor:</label>
        <div className="h-[400px] border rounded overflow-hidden">
          <MonacoEditor
            height="100%"
            language={getMonacoLang(language)}
            value={code}
            theme="vs-dark"
            onChange={(value) => setCode(value || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
      </div>

      <button
        onClick={handleRunCode}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Running..." : "Run Code"}
      </button>

      {error && <p className="mt-4 text-red-600">Error: {error}</p>}

      <div className="mt-6">
        <h2 className="text-xl font-medium mb-2">Output:</h2>
        <pre className="bg-gray-200 p-3 rounded whitespace-pre-wrap">
          {output}
        </pre>
      </div>
    </div>
  );
}
