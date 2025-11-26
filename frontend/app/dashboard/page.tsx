"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type TrainingMode = "fine_tune" | "rag" | null;
type DataMode = "qa" | "knowledge_base" | null;
type JobStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

interface Job {
  id: string;
  job_id: string;
  model_name: string;
  training_mode: "fine_tune" | "rag";
  data_mode: "qa" | "knowledge_base";
  status: JobStatus;
  progress: number;
  start_time: string;
  end_time?: string;
  model_path?: string;
  error?: string;
}

interface BaseModel {
  name: string;
  path: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [baseModels, setBaseModels] = useState<BaseModel[]>([]);
  const [selectedBaseModel, setSelectedBaseModel] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [trainingMode, setTrainingMode] = useState<TrainingMode>(null);
  const [dataMode, setDataMode] = useState<DataMode>(null);
  const [formData, setFormData] = useState({
    modelName: "",
    domain: "",
    audience: "",
    numSamples: 100,
    sampleQAPairs: [{ question: "", answer: "" }],
    minTopics: 15,
    maxTopics: 25,
    minWords: 5000,
    maxWords: 10000,
    referenceDataset: ""
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const fetchJobs = useCallback(async (token: string) => {
    try {
      const response = await fetch("http://localhost:8080/api/v1/jobs", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data || []);
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    }
  }, []);

  const fetchProfile = useCallback(async (token: string) => {
    try {
      const response = await fetch("http://localhost:8080/api/v1/profile", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      setUsername(data.username);
      fetchJobs(token);
    } catch (error) {
      console.error("Error fetching profile:", error);
      localStorage.removeItem("token");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [fetchJobs, router]);

  const fetchBaseModels = useCallback(async (token: string) => {
    try {
      const response = await fetch("http://localhost:8080/api/v1/base-models", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBaseModels(data || []);
        // Set default base model if available
        if (data && data.length > 0) {
          setSelectedBaseModel(data[0].name);
        }
      }
    } catch (error) {
      console.error("Failed to fetch base models:", error);
    }
  }, []);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    // Fetch user profile and base models
    fetchProfile(token);
    fetchBaseModels(token);
  }, [router, fetchProfile, fetchBaseModels]);

  // NOTE: `fetchJobs` is defined above with useCallback to keep a stable reference.

  // Poll for job updates every 5 seconds if there are active jobs
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || jobs.length === 0) return;

    const hasActiveJobs = jobs.some(
      (job) => job.status === "pending" || job.status === "running"
    );

    if (!hasActiveJobs) return;

    const interval = setInterval(() => {
      fetchJobs(token);
    }, 15000);

    return () => clearInterval(interval);
  }, [jobs, fetchJobs]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "running":
        return "bg-blue-100 text-blue-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "failed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status: JobStatus) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "running":
        return "Training...";
      case "pending":
        return "Pending";
      case "failed":
        return "Failed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const handleCancelJob = async (jobId: string, modelName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to cancel the training for "${modelName}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/v1/jobs/${jobId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refresh jobs list
        fetchJobs(token!);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to cancel job"}`);
      }
    } catch (error) {
      console.error("Error cancelling job:", error);
      alert("Failed to cancel job. Please try again.");
    }
  };

  const handleCreateDroplet = async () => {
    // Validate sample Q&A pairs for fine-tune mode
    if (trainingMode === "fine_tune") {
      const validPairs = formData.sampleQAPairs.filter(
        pair => pair.question.trim() && pair.answer.trim()
      );
      if (validPairs.length === 0) {
        setError("Please provide at least 1 complete Q&A pair (both question and answer)");
        return;
      }
    }

    setError("");
    setCreating(true);

    try {
      const token = localStorage.getItem("token");
      
      type CreateJobPayload = {
        model_name: string;
        training_mode: TrainingMode | null;
        data_mode: DataMode | null;
        config: {
          base_model?: string;
          domain?: string;
          audience?: string;
          num_samples?: number;
          sample_qa_pairs?: { question: string; answer: string }[];
          reference_dataset?: string;
          min_topics?: number;
          max_topics?: number;
          min_words?: number;
          max_words?: number;
        };
      };

      const payload: CreateJobPayload = {
        model_name: formData.modelName,
        training_mode: trainingMode,
        data_mode: dataMode,
        config: {
          base_model: selectedBaseModel,
          domain: formData.domain,
        }
      };

      // Add mode-specific fields based on data_mode (not training_mode)
      if (dataMode === "qa") {
        // Q&A mode needs audience and num_samples
        payload.config.num_samples = formData.numSamples;
        payload.config.audience = formData.audience;
        
        // Add sample Q&A pairs if provided (filter out empty pairs)
        const validPairs = formData.sampleQAPairs.filter(
          pair => pair.question.trim() && pair.answer.trim()
        );
        if (validPairs.length > 0) {
          payload.config.sample_qa_pairs = validPairs;
        }
        
        if (formData.referenceDataset) {
          payload.config.reference_dataset = formData.referenceDataset;
        }
      } else if (dataMode === "knowledge_base") {
        // Knowledge Base mode needs audience, min/max topics and words
        payload.config.audience = formData.audience;
        payload.config.min_topics = formData.minTopics;
        payload.config.max_topics = formData.maxTopics;
        payload.config.min_words = formData.minWords;
        payload.config.max_words = formData.maxWords;
      }

      const response = await fetch("http://localhost:8080/api/v1/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create droplet");
      }

      // Reset and close modal
      setShowModal(false);
      setStep(1);
      setTrainingMode(null);
      setDataMode(null);
      setFormData({
        modelName: "",
        domain: "",
        audience: "",
        numSamples: 100,
        sampleQAPairs: [{ question: "", answer: "" }],
        minTopics: 15,
        maxTopics: 25,
        minWords: 5000,
        maxWords: 10000,
        referenceDataset: ""
      });
      
      // Refresh jobs list
      fetchJobs(token!);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl font-semibold text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo at top */}
        <div className="p-6 border-b border-gray-200">
          <Image
            src="/droplet.png"
            alt="Droplet"
            width={120}
            height={40}
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => setActiveTab("home")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "home"
                    ? "text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                style={activeTab === "home" ? { backgroundColor: '#FF5F55' } : {}}
              >
                Home
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("api-keys")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "api-keys"
                    ? "text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                style={activeTab === "api-keys" ? { backgroundColor: '#FF5F55' } : {}}
              >
                API Keys
              </button>
            </li>
            <li>
              <Link
                href="/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <span>Docs</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Logout button at bottom */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 hover:shadow-lg"
            style={{ backgroundColor: '#FF5F55' }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === "home" && (
            <div>
              {/* My Droplets Section */}
              {jobs.length > 0 && (
                <div className="mb-12">
                  <h1 className="text-3xl font-bold text-gray-900 mb-8">My Droplets</h1>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {jobs.map((job) => (
                      <div
                        key={job.job_id}
                        className="bg-white rounded-lg p-8 border hover:shadow-lg transition-shadow flex flex-col group"
                        style={{ borderColor: '#FF5F55' }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {job.model_name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                job.status
                              )}`}
                            >
                              {getStatusText(job.status)}
                            </span>
                            {(job.status === "pending" || job.status === "running") && (
                              <button
                                onClick={() => handleCancelJob(job.job_id, job.model_name)}
                                className="p-1 hover:bg-red-100 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                title="Cancel training"
                              >
                                <svg
                                  className="w-4 h-4 text-red-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            {job.training_mode === "fine_tune"
                              ? "Fine-Tuned"
                              : "RAG"}
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            {job.data_mode === "qa" ? "Q&A" : "Knowledge Base"}
                          </span>
                        </div>

                        {(job.status === "running" || job.status === "pending") && (
                          <div className="mb-4">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Progress</span>
                              <span>{Math.round(job.progress)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${job.progress}%`,
                                  backgroundColor: '#FF5F55'
                                }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {job.error && (
                          <p className="text-xs text-red-600 mb-4">{job.error}</p>
                        )}

                        <button
                          disabled={job.status !== "completed"}
                          onClick={() => {
                            if (job.status === "completed" && job.model_path) {
                              const token = localStorage.getItem("token");
                              // Create a temporary link with auth header via fetch and blob
                              fetch(`http://localhost:8080/api/v1/jobs/${job.job_id}/download`, {
                                method: 'GET',
                                headers: {
                                  'Authorization': `Bearer ${token}`
                                }
                              })
                              .then(response => {
                                if (!response.ok) throw new Error('Download failed');
                                return response.blob();
                              })
                              .then(blob => {
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${job.model_name}_${job.job_id}.zip`;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);
                              })
                              .catch(error => {
                                console.error('Download error:', error);
                                alert('Failed to download model. Please try again.');
                              });
                            }
                          }}
                          className={`mt-auto w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                            job.status === "completed"
                              ? "text-white hover:shadow-lg cursor-pointer"
                              : "bg-gray-200 text-gray-400 cursor-not-allowed"
                          }`}
                          style={job.status === "completed" ? { backgroundColor: '#FF5F55' } : {}}
                        >
                          {job.status === "completed"
                            ? "Download"
                            : job.status === "cancelled"
                            ? "Cancelled"
                            : job.status === "failed"
                            ? "Failed"
                            : "Processing..."}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Base Models Section */}
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Base Models</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {baseModels.map((model) => (
                  <div 
                    key={model.name}
                    className={`bg-white rounded-lg p-8 border-2 hover:shadow-lg transition-all flex flex-col cursor-pointer ${
                      selectedBaseModel === model.name ? 'ring-2 ring-[#FF5F55] ring-offset-2' : ''
                    }`}
                    style={{ 
                      borderColor: selectedBaseModel === model.name ? '#FF5F55' : '#e5e7eb'
                    }}
                    onClick={() => setSelectedBaseModel(model.name)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{model.name}</h3>
                      {selectedBaseModel === model.name && (
                        <svg className="w-6 h-6 text-[#FF5F55]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {model.name.includes('Llama') && (
                        <>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            Lightweight
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            Fast Inference
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            General Purpose
                          </span>
                        </>
                      )}
                      {model.name.includes('Nemotron') && (
                        <>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            High Performance
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            FP8 Quantized
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            Advanced Reasoning
                          </span>
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                            ⚠️ GPU Required
                          </span>
                        </>
                      )}
                    </div>
                    {model.name.includes('Nemotron') && (
                      <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-xs text-orange-800">
                          <strong>Note:</strong> This model requires NVIDIA GPU with CUDA. Not compatible with macOS or CPU-only systems.
                        </p>
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBaseModel(model.name);
                        setShowModal(true);
                      }}
                      className="mt-auto w-full py-2.5 px-4 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:shadow-lg cursor-pointer"
                      style={{ backgroundColor: '#FF5F55' }}
                    >
                      Create New Droplet
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === "api-keys" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">API Keys</h1>
              <p className="text-gray-600">
                You have not hosted any droplet on our cloud yet. Host a droplet to generate API keys.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Droplet Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Create New Droplet
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setStep(1);
                  setTrainingMode(null);
                  setDataMode(null);
                  setFormData({
                    modelName: "",
                    domain: "",
                    audience: "",
                    numSamples: 100,
                    sampleQAPairs: [{ question: "", answer: "" }],
                    minTopics: 15,
                    maxTopics: 25,
                    minWords: 5000,
                    maxWords: 10000,
                    referenceDataset: ""
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Step 1: Choose Training Mode */}
            {step === 1 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Choose Training Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setTrainingMode("fine_tune");
                      setDataMode("qa");
                      setStep(2);
                    }}
                    className="border-2 rounded-lg p-6 text-left hover:shadow-lg transition-all"
                    style={{ borderColor: trainingMode === "fine_tune" ? '#FF5F55' : '#e5e7eb' }}
                  >
                    <h4 className="text-xl font-bold mb-2">Fine-Tuning</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      We will generate Q&A pairs to train your model
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="font-semibold">Time:</span>
                      <span>2-3 days</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <span className="font-semibold">Cost:</span>
                      <span>$$</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setTrainingMode("rag");
                      setDataMode("knowledge_base");
                      setStep(2);
                    }}
                    className="border-2 rounded-lg p-6 text-left hover:shadow-lg transition-all"
                    style={{ borderColor: trainingMode === "rag" ? '#FF5F55' : '#e5e7eb' }}
                  >
                    <h4 className="text-xl font-bold mb-2">RAG</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Build a knowledge base for retrieval-augmented generation
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="font-semibold">Time:</span>
                      <span>Few hours</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <span className="font-semibold">Cost:</span>
                      <span>$</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Configuration */}
            {step === 2 && (
              <div>
                <button
                  onClick={() => {
                    setStep(1);
                    setTrainingMode(null);
                    setDataMode(null);
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>

                <h3 className="text-lg font-semibold mb-4">Configure Your Droplet</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Model Name *
                    </label>
                    <input
                      type="text"
                      value={formData.modelName}
                      onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5F55] focus:border-transparent outline-none"
                      placeholder="my-custom-model"
                    />
                  </div>

                  <div className="flex items-stretch gap-3">
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selected Base Model
                      </label>
                      <p className="text-base font-semibold text-gray-900">{selectedBaseModel}</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center bg-white">
                      <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                        Provider
                      </label>
                      <Image 
                        src="/service_provider.png" 
                        alt="Service Provider" 
                        width={80} 
                        height={80}
                        className="rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Domain / Topic *
                    </label>
                    <input
                      type="text"
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5F55] focus:border-transparent outline-none"
                      placeholder="e.g., Healthcare, Legal, Finance"
                    />
                  </div>

                  {/* Target Audience - Required for both modes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Audience *
                    </label>
                    <input
                      type="text"
                      value={formData.audience}
                      onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5F55] focus:border-transparent outline-none"
                      placeholder="e.g., Medical professionals, Students"
                    />
                  </div>

                  {trainingMode === "fine_tune" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Number of Q&A Pairs
                        </label>
                        <input
                          type="number"
                          value={formData.numSamples}
                          onChange={(e) => setFormData({ ...formData, numSamples: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5F55] focus:border-transparent outline-none"
                          min="10"
                          max="10000"
                        />
                      </div>

                      {/* Sample Q&A Pairs */}
                      <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Sample Q&A Pairs *
                            </label>
                            <p className="text-xs text-gray-500">
                              Provide as many unique Q&A pairs as possible. At least 1 complete pair is required. The answers should match the style and detail you want from your fine-tuned model.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              sampleQAPairs: [...formData.sampleQAPairs, { question: "", answer: "" }]
                            })}
                            className="text-sm px-3 py-1 rounded-md text-white hover:shadow-lg transition-all"
                            style={{ backgroundColor: '#FF5F55' }}
                          >
                            + Add Pair
                          </button>
                        </div>
                        
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {formData.sampleQAPairs.map((pair, index) => (
                            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700">Pair {index + 1}</span>
                                {formData.sampleQAPairs.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => setFormData({
                                      ...formData,
                                      sampleQAPairs: formData.sampleQAPairs.filter((_, i) => i !== index)
                                    })}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  placeholder="Question"
                                  value={pair.question}
                                  onChange={(e) => {
                                    const newPairs = [...formData.sampleQAPairs];
                                    newPairs[index].question = e.target.value;
                                    setFormData({ ...formData, sampleQAPairs: newPairs });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5F55] focus:border-transparent outline-none text-sm"
                                />
                                <textarea
                                  placeholder="Answer (detailed response matching desired model output)"
                                  value={pair.answer}
                                  onChange={(e) => {
                                    const newPairs = [...formData.sampleQAPairs];
                                    newPairs[index].answer = e.target.value;
                                    setFormData({ ...formData, sampleQAPairs: newPairs });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5F55] focus:border-transparent outline-none text-sm"
                                  rows={3}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {trainingMode === "rag" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Min Topics *
                          </label>
                          <input
                            type="number"
                            value={formData.minTopics}
                            onChange={(e) => setFormData({ ...formData, minTopics: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5F55] focus:border-transparent outline-none"
                            placeholder="15"
                            min="5"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Topics *
                          </label>
                          <input
                            type="number"
                            value={formData.maxTopics}
                            onChange={(e) => setFormData({ ...formData, maxTopics: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5F55] focus:border-transparent outline-none"
                            placeholder="25"
                            min="10"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Min Total Words *
                          </label>
                          <input
                            type="number"
                            value={formData.minWords}
                            onChange={(e) => setFormData({ ...formData, minWords: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5F55] focus:border-transparent outline-none"
                            placeholder="5000"
                            min="1000"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Total Words *
                          </label>
                          <input
                            type="number"
                            value={formData.maxWords}
                            onChange={(e) => setFormData({ ...formData, maxWords: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5F55] focus:border-transparent outline-none"
                            placeholder="10000"
                            min="2000"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reference Dataset (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.referenceDataset}
                      onChange={(e) => setFormData({ ...formData, referenceDataset: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5F55] focus:border-transparent outline-none"
                      placeholder="Path to your reference data"
                    />
                  </div>
                </div>

                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleCreateDroplet}
                    disabled={creating || !formData.modelName || !formData.domain || 
                      (trainingMode === "fine_tune" && !formData.audience)}
                    className="flex-1 py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#FF5F55' }}
                  >
                    {creating ? "Creating..." : "Create Droplet"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
