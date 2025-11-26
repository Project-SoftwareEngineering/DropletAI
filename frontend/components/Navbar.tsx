'use client';

import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';
import SlideArrowButton from "@/components/animata/button/slide-arrow-button";
import { Highlighter } from "@/components/magicui/highlighter";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  

  const handlePricingClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    alert('Coming Soon!\n\nWe are currently accepting waitlisted users only. Pricing details will be available soon.');
  };

  return (
    <>
      <nav className="fixed top-14 left-0 right-0 bg-white border-b border-black z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Image
                src="/droplet.png"
                alt="Droplet"
                width={100}
                height={32}
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link
                href="/playground"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors duration-200"
                onMouseEnter={() => setHoveredItem('playground')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {hoveredItem === 'playground' ? (
                  <Highlighter 
                    action="highlight" 
                    color="#FF5F55" 
                    animationDuration={300}
                    strokeWidth={2}
                  >
                    Playground
                  </Highlighter>
                ) : (
                  'Playground'
                )}
              </Link>
              <a
                href="#pricing"
                onClick={handlePricingClick}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredItem('pricing')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {hoveredItem === 'pricing' ? (
                  <Highlighter 
                    action="highlight" 
                    color="#FF5F55" 
                    animationDuration={300}
                    strokeWidth={2}
                  >
                    Pricing
                  </Highlighter>
                ) : (
                  'Pricing'
                )}
              </a>
              <Link
                href="/docs"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors duration-200"
                onMouseEnter={() => setHoveredItem('docs')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {hoveredItem === 'docs' ? (
                  <Highlighter 
                    action="highlight" 
                    color="#FF5F55" 
                    animationDuration={300}
                    strokeWidth={2}
                  >
                    Docs
                  </Highlighter>
                ) : (
                  'Docs'
                )}
              </Link>
            </div>
          </div>

          {/* Get Started Button */}
          <div className="hidden md:block">
            <Link href="/login">
              <SlideArrowButton 
                text="Get Started" 
                primaryColor="#FF5F55"
                className="text-sm py-2 scale-70"
              />
            </Link>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500 transition-colors duration-200"
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg
                  className="block h-6 w-6 transition-transform duration-200"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6 transition-transform duration-200 rotate-90"
                  xmlns="http://www.w3.org/2000/svg"
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
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div 
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-100">
          <Link
            href="/playground"
            className="text-gray-700 hover:text-gray-900 block px-3 py-2 text-base font-medium transition-colors duration-200"
            onMouseEnter={() => setHoveredItem('playground-mobile')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            {hoveredItem === 'playground-mobile' ? (
              <Highlighter 
                action="highlight" 
                color="#FF5F55" 
                animationDuration={300}
                strokeWidth={2}
              >
                Playground
              </Highlighter>
            ) : (
              'Playground'
            )}
          </Link>
          <a
            href="#pricing"
            onClick={handlePricingClick}
            className="text-gray-700 hover:text-gray-900 block px-3 py-2 text-base font-medium transition-colors duration-200 cursor-pointer"
            onMouseEnter={() => setHoveredItem('pricing-mobile')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            {hoveredItem === 'pricing-mobile' ? (
              <Highlighter 
                action="highlight" 
                color="#FF5F55" 
                animationDuration={300}
                strokeWidth={2}
              >
                Pricing
              </Highlighter>
            ) : (
              'Pricing'
            )}
          </a>
          <Link
            href="/docs"
            className="text-gray-700 hover:text-gray-900 block px-3 py-2 text-base font-medium transition-colors duration-200"
            onMouseEnter={() => setHoveredItem('docs-mobile')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            {hoveredItem === 'docs-mobile' ? (
              <Highlighter 
                action="highlight" 
                color="#FF5F55" 
                animationDuration={300}
                strokeWidth={2}
              >
                Docs
              </Highlighter>
            ) : (
              'Docs'
            )}
          </Link>
          <div className="px-3 py-2">
            <Link href="/login">
              <SlideArrowButton 
                text="Get Started" 
                primaryColor="#FF5F55"
                className="text-sm px-4 py-1.5"
              />
            </Link>
          </div>
        </div>
      </div>
    </nav>
    </>
  );
}
