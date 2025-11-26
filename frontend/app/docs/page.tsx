"use client";

import Image from "next/image";
import Link from "next/link";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <Image
                src="/droplet.png"
                alt="Droplet"
                width={100}
                height={32}
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Docs Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Documentation</h1>
          <p className="text-gray-600">
            Documentation will be available here soon.
          </p>
        </div>
      </main>
    </div>
  );
}
