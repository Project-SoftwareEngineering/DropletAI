'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User } from 'lucide-react';

type ModelType = 'healthcare-qlora';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ModelOption {
  id: ModelType;
  name: string;
  description: string;
  type: 'Fine-tuned';
}

const models: ModelOption[] = [
  {
    id: 'healthcare-qlora',
    name: 'Llama 3 Healthcare',
    description: 'AI assistant for healthcare conversations and medical information',
    type: 'Fine-tuned',
  },
];

export default function PlaygroundPage() {
  const [selectedModel, setSelectedModel] = useState<ModelType>('healthcare-qlora');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/playground/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          message: userMessage.content,
          history: messages,
        }),
      });

      const data = await response.json();
      
      console.log('API Response:', { status: response.status, ok: response.ok, data });

      if (!response.ok) {
        // Handle rate limit error
        if (response.status === 429) {
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.message || 'Rate limit exceeded. You can send up to 5 messages. The limit refills gradually over time.',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          return;
        }
        
        console.error('API Error:', data);
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || 'I apologize, but I encountered an error processing your request.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'I apologize, but I am currently experiencing technical difficulties. Please try again in a moment.'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="min-h-screen pt-32 pb-8" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)]">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* Chat Header */}
            <div className="border-b border-gray-200 p-4 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">AI Playground</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Test our distilled AI models
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      clearChat();
                    }}
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Clear Chat
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setIsSidebarOpen(!isSidebarOpen);
                    }}
                    type="button"
                    className="lg:hidden px-4 py-2 text-sm font-medium text-white bg-[#FF5F55] hover:bg-[#E54E45] rounded-lg transition-colors"
                  >
                    Models
                  </button>
                </div>
              </div>
              <div className="mt-3 lg:hidden">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                  <span className="text-xs font-medium text-gray-700">
                    {models.find((m) => m.id === selectedModel)?.name}
                  </span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-600">
                    {models.find((m) => m.id === selectedModel)?.type}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-[#FF5F55] bg-opacity-10 rounded-full flex items-center justify-center mb-4">
                    <Bot className="w-8 h-8 text-[#FF5F55]" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Start a conversation
                  </h2>
                  <p className="text-gray-600 max-w-md">
                    Ask questions and interact with our distilled AI models. Choose a model from
                    the sidebar and start chatting.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user'
                          ? 'bg-[#FF5F55] bg-opacity-10'
                          : 'bg-gray-100'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="w-5 h-5 text-[#FF5F55]" />
                      ) : (
                        <Bot className="w-5 h-5 text-gray-700" />
                      )}
                    </div>
                    <div
                      className={`flex-1 max-w-3xl ${
                        message.role === 'user' ? 'text-right' : 'text-left'
                      }`}
                    >
                      <div
                        className={`inline-block px-4 py-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-[#FF5F55] text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <div className="inline-block px-4 py-3 rounded-lg bg-gray-100">
                      <Loader2 className="w-5 h-5 text-gray-700 animate-spin" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="flex gap-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
                  className="flex-1 resize-none px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5F55] focus:border-transparent text-gray-900 placeholder-gray-500"
                  rows={3}
                  disabled={isLoading}
                />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  type="button"
                  disabled={!input.trim() || isLoading}
                  className="px-6 py-3 bg-[#FF5F55] text-white rounded-lg hover:bg-[#E54E45] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar - Model Selector */}
          <div
            className={`${
              isSidebarOpen ? 'fixed inset-0 z-50 lg:relative lg:z-0' : 'hidden'
            } lg:block lg:w-80`}
          >
            {/* Mobile overlay */}
            {isSidebarOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* Sidebar content */}
            <div
              className={`${
                isSidebarOpen ? 'fixed right-0 top-0 bottom-0' : ''
              } lg:relative w-80 bg-white rounded-lg border border-gray-200 shadow-sm p-6 overflow-y-auto lg:h-full`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Select Model</h2>
                {isSidebarOpen && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setIsSidebarOpen(false);
                    }}
                    type="button"
                    className="lg:hidden text-gray-500 hover:text-gray-700"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
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

              <div className="space-y-3">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedModel(model.id);
                      setIsSidebarOpen(false);
                      clearChat();
                    }}
                    type="button"
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedModel === model.id
                        ? 'border-[#FF5F55] bg-white'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{model.name}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          model.type === 'Fine-tuned'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {model.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{model.description}</p>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">About the Model</h3>
                <div className="space-y-2 text-xs text-gray-600">
                  <p>
                    This is a specialized healthcare AI assistant powered by Gemini API, designed to provide accurate and helpful medical information.
                  </p>
                  <p className="text-yellow-700">
                    <strong>Note:</strong> Limit of 5 messages. The limit refills gradually over time.
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> This is a testing playground. Conversations are not saved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
