"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import AIShapeAnimation from "../components/AIShapeAnimation";
import { Highlighter } from "../components/magicui/highlighter";
import { LineShadowText } from "@/components/magicui/line-shadow-text";
import SlideArrowButton from "@/components/animata/button/slide-arrow-button";
import { WobbleCard } from "@/components/ui/wobble-card";
import { AnimatedList } from "@/components/ui/animated-list";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import Link from "next/link";
import Image from "next/image";


export default function Home() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Redirect to dashboard if already logged in
    const token = localStorage.getItem("token");
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);
  const cloudRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const edtechRef = useRef<HTMLDivElement>(null);
  const medicalRef = useRef<HTMLDivElement>(null);
  const legalRef = useRef<HTMLDivElement>(null);
  const fintechRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* First Section - Hero */}
      <div 
        className="min-h-screen flex items-center justify-center p-4 md:p-8 pt-36 md:pt-40" 
        style={{backgroundColor: '#F5F5F5'}}
        data-scroll-section
      >
        <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Text content - Full width on mobile, 2/3 on large screens */}
          <div className="w-full lg:w-2/3 space-y-5" data-scroll data-scroll-speed="0.65">
            <div>
              <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold mb-2">
                Distilled <LineShadowText>AI</LineShadowText>
              </h1>
              <h1 className="text-3xl sm:text-3xl lg:text-4xl font-bold mb-4">
                for your Business.
              </h1>
            </div>
            
            <div className="space-y-6 text-base sm:text-lg lg:text-xl leading-relaxed">
              <p>
                DropletAI condenses expensive commodity LLM&apos;s into <Highlighter action="underline" color="#FF5F55" delay={1000}>lightweight & specialized</Highlighter> models, <span className="hidden lg:inline"><br /></span> that Run Efficiently on your Own Machines. <span className="hidden lg:inline"><br /></span><Highlighter action="underline" color="#FF5F55" delay={1000}>Faster, Cheaper & Tailored</Highlighter> for your own Needs.
              </p>
            </div>
            
            {/* CTA Button */}
            <div className="pt-6 lg:pt-8">
              <Link href="/login">
                <SlideArrowButton 
                  text="Get Started" 
                  primaryColor="#FF5F55"
                  className="text-base lg:text-lg"
                />
              </Link>
            </div>
          </div>

          {/* Animation - Always visible, positioned below text on mobile, beside text on large screens */}
          <div className="w-full lg:w-1/3 flex justify-center mt-2 lg:mt-0" data-scroll data-scroll-speed="0.85">
            <AIShapeAnimation />
          </div>
        </div>
      </div>

      {/* Second Section - How It Works */}
      <div 
        className="min-h-screen w-full flex flex-col justify-center py-8 md:py-12 lg:py-10" 
        style={{backgroundColor: '#FFFFFF'}}
        data-scroll-section
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4 text-gray-900">
              Your own LLM, without any complexity
            </h2>
            <p className="text-3xl lg:text-base text-gray-600">
              In just 3 steps 🙌🏻
            </p>
          </div>

          {/* Three Steps */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-full mx-auto w-full flex-1">
            {/* Step 1 - Pink Card (Large) */}
            <WobbleCard
              containerClassName="col-span-1 lg:col-span-2 h-full bg-pink-800 min-h-[200px] lg:min-h-[280px]"
              className="!px-6 !py-6 md:!px-8 md:!py-8"
            >
              <div className="max-w-xs">
                <div className="flex items-center mb-3">
                  <div 
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white text-sm md:text-base font-bold mr-4"
                    style={{backgroundColor: '#FF5F55'}}
                  >
                    1
                  </div>
                </div>
                <h2 className="text-left text-balance text-base md:text-lg lg:text-xl xl:text-2xl font-semibold tracking-[-0.015em] text-white">
                  Talk to our agent
                </h2>
                <p className="mt-2 text-left text-sm md:text-base text-neutral-200">
                  Chat and answer some Q&A for understanding your niche.
                </p>
              </div>
            </WobbleCard>

            {/* Step 2 - Blue Card (Small) */}
            <WobbleCard 
              containerClassName="col-span-1 bg-blue-900 min-h-[200px] lg:min-h-[280px]"
              className="!px-6 !py-6 md:!px-8 md:!py-8"
            >
              <div className="flex items-center mb-3">
                <div 
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white text-sm md:text-base font-bold mr-4"
                  style={{backgroundColor: '#FF5F55'}}
                >
                  2
                </div>
              </div>
              <h2 className="max-w-80 text-left text-balance text-base md:text-lg lg:text-xl xl:text-2xl font-semibold tracking-[-0.015em] text-white">
                Train your own droplet
              </h2>
              <p className="mt-2 max-w-[18rem] text-left text-sm md:text-base text-neutral-200">
                Choose configurations and wait for magic to happen.
              </p>
            </WobbleCard>

            {/* Step 3 - Full Width Blue Card (Largest) */}
            <WobbleCard 
              containerClassName="col-span-1 lg:col-span-3 bg-blue-900 min-h-[250px] lg:min-h-[350px]"
              className="!px-6 !py-6 md:!px-8 md:!py-8"
            >
              <div className="flex flex-col lg:flex-row items-start justify-between w-full h-full">
                <div className="max-w-sm">
                  <div className="flex items-center mb-3">
                    <div 
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white text-sm md:text-base font-bold mr-4"
                      style={{backgroundColor: '#FF5F55'}}
                    >
                      3
                    </div>
                  </div>
                  <h2 className="max-w-sm md:max-w-lg text-left text-balance text-base md:text-lg lg:text-xl xl:text-2xl font-semibold tracking-[-0.015em] text-white">
                    Deploy your droplet
                  </h2>
                  <p className="mt-2 max-w-[18rem] text-left text-sm md:text-base text-neutral-200">
                    Choose from multiple deployment options to suit your needs.
                  </p>
                </div>
                
                {/* Deployment Options - Animated List */}
                <div className="mt-6 lg:mt-0 lg:ml-8 flex-1 max-w-sm md:max-w-lg lg:max-w-xs h-[80px] lg:h-[60px] flex items-start">
                  <AnimatedList delay={3000} className="gap-2 w-full">
                    <div className="flex items-center bg-white rounded-lg p-2 md:p-3 lg:p-2 border border-white/20 shadow-md w-full min-w-[280px] md:min-w-[320px] lg:min-w-0 lg:w-auto">
                      <div className="w-8 h-8 rounded-md flex items-center justify-center mr-2 p-1" style={{backgroundColor: '#F5F5F5'}}>
                        <Image 
                          src="/aws.png" 
                          alt="AWS" 
                          width={16} 
                          height={16} 
                          className="object-contain"
                          loading="lazy"
                          quality={75}
                        />
                      </div>
                      <div>
                        <h3 className="text-gray-800 font-medium text-xs">AWS Cloud</h3>
                        <p className="text-gray-600 text-xs">Scalable & reliable</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center bg-white rounded-lg p-2 md:p-3 lg:p-2 border border-white/20 shadow-md w-full min-w-[280px] md:min-w-[320px] lg:min-w-0 lg:w-auto">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center mr-2">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-gray-800 font-medium text-xs">Docker</h3>
                        <p className="text-gray-600 text-xs">Easy containerization</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center bg-white rounded-lg p-2 md:p-3 lg:p-2 border border-white/20 shadow-md w-full min-w-[280px] md:min-w-[320px] lg:min-w-0 lg:w-auto">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center mr-2">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-gray-800 font-medium text-xs">Self-Host</h3>
                        <p className="text-gray-600 text-xs">Full control & privacy</p>
                      </div>
                    </div>
                  </AnimatedList>
                </div>
              </div>
            </WobbleCard>
          </div>
        </div>
      </div>

      {/* Third Section - New Section */}
      <div 
        className="w-full py-6 sm:py-8 lg:py-2 px-6 sm:px-8" 
        style={{backgroundColor: '#FFFFFF'}}
        data-scroll-section
      >
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-xs sm:text-base lg:text-lg font-normal pt-2 mb-6 sm:pt-0 sm:mb-6 lg:mb-6 text-gray-700">
            Trusted by professionals across industries
          </h2>
          <div className="flex items-center justify-center sm:gap-30 gap-12 pb-6 sm:pb-4 lg:pb-8">
            <Image 
              src="/sri.png" 
              alt="SRI" 
              width={120} 
              height={42} 
              className="object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 w-16 sm:w-20 lg:w-32 h-auto"
              loading="lazy"
              quality={75}
            />
            <Image 
              src="/salesforces.svg" 
              alt="Salesforce" 
              width={70} 
              height={28} 
              className="object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 w-10 sm:w-14 lg:w-20 h-auto"
              loading="lazy"
              quality={75}
            />
         
              <Image 
              src="/paytm.png" 
              alt="Paytm" 
              width={50} 
              height={20} 
              className="object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 w-9 sm:w-12 lg:w-16 h-auto"
              loading="lazy"
              quality={75}
            />
            <Image 
              src="/iit_patna.png" 
              alt="IIT Patna" 
              width={60} 
              height={24} 
              className="object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 w-10 sm:w-12 lg:w-16 h-auto"
              loading="lazy"
              quality={75}
            />
          </div>
        </div>
      </div>

      {/* Fourth Section - Animated Beam with Domain Applications */}
      <div 
        className="h-auto lg:h-[85vh] w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 lg:py-8" 
        style={{backgroundColor: '#F5F5F5'}}
        data-scroll-section
      >
        <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-12">
          {/* Top/Left Side - Animated Beam Container */}
          <div className="w-full lg:flex-1 relative flex flex-col items-center justify-center">
            {/* Header for top/left side */}
            <div className="text-center mb-8 lg:mb-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-4 text-gray-900">
                Powering Innovation Across Industries
              </h2>
              <p className="text-base text-gray-600">
                Specialized AI droplets tailored for your domain
              </p>
            </div>

            {/* Beam Animation Area - Responsive sizing */}
            <div ref={containerRef} className="relative w-[300px] sm:w-[350px] lg:w-[400px] h-[250px] sm:h-[280px] lg:h-[300px] flex items-center justify-center mx-auto">
              {/* Cloud - Top */}
              <div 
                ref={cloudRef}
                className="absolute top-0 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10"
              >
                <div className="text-6xl">☁️</div>
              </div>

              {/* Center - Droplet Logo - Responsive sizing */}
              <div 
                ref={centerRef}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center z-10"
              >
                <Image 
                  src="/D.png" 
                  alt="Droplet" 
                  width={32} 
                  height={32} 
                  className="object-contain sm:w-9 sm:h-9 lg:w-10 lg:h-10"
                  priority
                  quality={90}
                />
              </div>

              {/* Bottom Row - 4 Domain Components - Responsive sizing */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between">
                {/* EdTech */}
                <div 
                  ref={edtechRef}
                  className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center z-10"
                >
                  <div className="text-sm sm:text-lg lg:text-xl">🎓</div>
                </div>

                {/* Medical */}
                <div 
                  ref={medicalRef}
                  className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center z-10"
                >
                  <div className="text-sm sm:text-lg lg:text-xl">⚕️</div>
                </div>

                {/* Legal */}
                <div 
                  ref={legalRef}
                  className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center z-10"
                >
                  <div className="text-sm sm:text-lg lg:text-xl">⚖️</div>
                </div>

                {/* FinTech */}
                <div 
                  ref={fintechRef}
                  className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center z-10"
                >
                  <div className="text-sm sm:text-lg lg:text-xl">💰</div>
                </div>
              </div>

              {/* Animated Beams */}
              {/* From Cloud to Center */}
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={cloudRef}
                toRef={centerRef}
                gradientStartColor="#FF5F55"
                gradientStopColor="#FF5F55"
                pathColor="#9CA3AF"
                pathOpacity={0.4}
                pathWidth={2}
                curvature={20}
                delay={0}
                duration={6}
                reverse={false}
              />

              {/* From Center to EdTech */}
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={centerRef}
                toRef={edtechRef}
                gradientStartColor="#FF5F55"
                gradientStopColor="#FF5F55"
                pathColor="#9CA3AF"
                pathOpacity={0.4}
                pathWidth={2}
                curvature={15}
                delay={2}
                duration={6}
                reverse={false}
              />

              {/* From Center to Medical */}
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={centerRef}
                toRef={medicalRef}
                gradientStartColor="#FF5F55"
                gradientStopColor="#FF5F55"
                pathColor="#9CA3AF"
                pathOpacity={0.4}
                pathWidth={2}
                curvature={10}
                delay={3}
                duration={6}
                reverse={false}
              />

              {/* From Center to Legal */}
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={centerRef}
                toRef={legalRef}
                gradientStartColor="#FF5F55"
                gradientStopColor="#FF5F55"
                pathColor="#9CA3AF"
                pathOpacity={0.4}
                pathWidth={2}
                curvature={10}
                delay={4}
                duration={6}
                reverse={false}
              />

              {/* From Center to FinTech */}
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={centerRef}
                toRef={fintechRef}
                gradientStartColor="#FF5F55"
                gradientStopColor="#FF5F55"
                pathColor="#9CA3AF"
                pathOpacity={0.4}
                pathWidth={2}
                curvature={15}
                delay={5}
                duration={6}
                reverse={false}
              />
            </div>
          </div>

          {/* Bottom/Right Side - Content */}
          <div className="w-full lg:flex-1 flex flex-col justify-center lg:pl-8">
            <div className="text-center lg:text-left mb-6 lg:mb-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-2 text-gray-900">
                Use ready made templates
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-6">
              {/* Education */}
              <div className="flex items-start gap-4">
                <div>
                  <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Education</h3>
                  <p className="text-sm lg:text-base text-gray-600">Personalized learning paths, automated grading, and intelligent tutoring systems that adapt to each student&apos;s pace and learning style.</p>
                </div>
              </div>

              {/* Healthcare */}
              <div className="flex items-start gap-4">
                <div>
                  <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Healthcare</h3>
                  <p className="text-sm lg:text-base text-gray-600">Medical diagnosis assistance, clinical documentation automation, and drug discovery acceleration for improved patient outcomes.</p>
                </div>
              </div>

              {/* Legal */}
              <div className="flex items-start gap-4">
                <div>
                  <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Legal</h3>
                  <p className="text-sm lg:text-base text-gray-600">Contract analysis, legal research automation, and compliance monitoring to streamline legal workflows and reduce risks.</p>
                </div>
              </div>

              {/* Finance */}
              <div className="flex items-start gap-4">
                <div>
                  <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Finance</h3>
                  <p className="text-sm lg:text-base text-gray-600">Real-time fraud detection, automated credit scoring, and algorithmic trading strategies for smarter financial decisions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Fifth Section - Why Droplet? */}
      {/* <div 
        className="h-[90vh] w-full flex items-center justify-center pl-6 sm:pl-8 py-20" 
        style={{backgroundColor: '#000000'}}
        data-scroll-section
      >
      <div 
        className="h-[90vh] w-full flex items-center justify-start pl-6 sm:pl-8 py-20" 
        style={{backgroundColor: '#000000'}}
        data-scroll-section
      >
        <div className="w-full h-full flex items-center gap-12">
          <div className="w-1/3 max-w-md h-full flex flex-col justify-center pr-8">
        <h2 className="text-4xl font-bold mb-4 text-white">
          Why Droplet?
        </h2>
        <p className="text-md text-white mb-8">
          90% smaller, 10x faster, 10x cheaper, 100% yours.
        </p>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={prevSlide}
            className="w-12 h-12 border border-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all"
          >
            <svg className="w-5 h-5 text-white hover:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            onClick={nextSlide}
            className="w-12 h-12 border border-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all"
          >
            <svg className="w-5 h-5 text-white hover:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
          </div>

          <div className="flex-1 h-full flex items-center justify-start overflow-hidden">
        <div 
          className="flex gap-6 transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(-${currentSlide * (cardWidth + gap)}px)`,
            width: `${totalSlides * (cardWidth + gap)}px`
          }}
        >
            <div className="h-[28rem] rounded-2xl overflow-hidden flex-shrink-0" style={{width: `${cardWidth}px`}}>
          <DirectionAwareHover
            imageUrl="/ocean.jpg"
            className="w-full h-full"
            imageClassName="object-cover w-full h-full scale-100"
            childrenClassName="absolute inset-0 flex flex-col justify-end p-8 z-10 bg-gradient-to-t from-black/70 to-transparent"
          >
            <div className="text-white">
              <h3 className="text-2xl font-bold mb-3">Lightning Fast</h3>
              <p className="text-base text-gray-200 leading-relaxed">Experience inference speeds that make real-time AI interactions feel instant.</p>
            </div>
          </DirectionAwareHover>
            </div>

            <div className="h-[28rem] rounded-2xl overflow-hidden flex-shrink-0" style={{width: `${cardWidth}px`}}>
          <DirectionAwareHover
            imageUrl="/ocean.jpg"
            className="w-full h-full"
            imageClassName="object-cover w-full h-full scale-100"
            childrenClassName="absolute inset-0 flex flex-col justify-end p-8 z-10 bg-gradient-to-t from-black/70 to-transparent"
          >
            <div className="text-white">
              <h3 className="text-2xl font-bold mb-3">Cost Efficient</h3>
              <p className="text-base text-gray-200 leading-relaxed">Reduce your AI infrastructure costs by up to 95% while maintaining performance.</p>
            </div>
          </DirectionAwareHover>
            </div>

            <div className="h-[28rem] rounded-2xl overflow-hidden flex-shrink-0" style={{width: `${cardWidth}px`}}>
          <DirectionAwareHover
            imageUrl="/ocean.jpg"
            className="w-full h-full"
            imageClassName="object-cover w-full h-full scale-100"
            childrenClassName="absolute inset-0 flex flex-col justify-end p-8 z-10 bg-gradient-to-t from-black/70 to-transparent"
          >
            <div className="text-white">
              <h3 className="text-2xl font-bold mb-3">Privacy First</h3>
              <p className="text-base text-gray-200 leading-relaxed">Your data stays yours. Run everything on-premises with complete control.</p>
            </div>
          </DirectionAwareHover>
            </div>

            <div className="h-[28rem] rounded-2xl overflow-hidden flex-shrink-0" style={{width: `${cardWidth}px`}}>
          <DirectionAwareHover
            imageUrl="/ocean.jpg"
            className="w-full h-full"
            imageClassName="object-cover w-full h-full scale-100"
            childrenClassName="absolute inset-0 flex flex-col justify-end p-8 z-10 bg-gradient-to-t from-black/70 to-transparent"
          >
            <div className="text-white">
              <h3 className="text-2xl font-bold mb-3">Infinitely Scalable</h3>
              <p className="text-base text-gray-200 leading-relaxed">Scale from single requests to millions without breaking a sweat.</p>
            </div>
          </DirectionAwareHover>
            </div>

            <div className="h-[28rem] rounded-2xl overflow-hidden flex-shrink-0" style={{width: `${cardWidth}px`}}>
          <DirectionAwareHover
            imageUrl="/ocean.jpg"
            className="w-full h-full"
            imageClassName="object-cover w-full h-full scale-100"
            childrenClassName="absolute inset-0 flex flex-col justify-end p-8 z-10 bg-gradient-to-t from-black/70 to-transparent"
          >
            <div className="text-white">
              <h3 className="text-2xl font-bold mb-3">Easy Integration</h3>
              <p className="text-base text-gray-200 leading-relaxed">Drop-in replacement for existing APIs with minimal code changes.</p>
            </div>
          </DirectionAwareHover>
            </div>

            <div className="h-[28rem] rounded-2xl overflow-hidden flex-shrink-0" style={{width: `${cardWidth}px`}}>
          <DirectionAwareHover
            imageUrl="/ocean.jpg"
            className="w-full h-full"
            imageClassName="object-cover w-full h-full scale-100"
            childrenClassName="absolute inset-0 flex flex-col justify-end p-8 z-10 bg-gradient-to-t from-black/70 to-transparent"
          >
            <div className="text-white">
              <h3 className="text-2xl font-bold mb-3">Expert Support</h3>
              <p className="text-base text-gray-200 leading-relaxed">24/7 expert support to help you optimize and deploy successfully.</p>
            </div>
          </DirectionAwareHover>
            </div>
          </div>
        </div>
          </div>
        </div>
      </div> */}
      {/* Sixth Section - Container Scroll Animation */}
      <div 
        className="h-[65vh] md:h-[80vh] lg:h-[120vh] w-full" 
        style={{backgroundColor: '#FFFFFF'}}
        data-scroll-section
        data-scroll-section-id="container-scroll"
      >
        <div className="flex flex-col pt-8 overflow-hidden">
          <ContainerScroll
            titleComponent={
              <>
                <h1 className="text-4xl font-semibold text-black dark:text-white">
                  Let&apos;s train your <br />
                  <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none">
                    first droplet
                  </span>
                </h1>
              </>
            }
          >
            <div className="h-full w-full flex flex-col items-center justify-center p-3 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100">
              {/* Header Section */}
              <div className="text-left mb-4 md:mb-8 w-full max-w-lg">
                <h2 className="text-lg md:text-3xl font-bold text-gray-800 mb-2 md:mb-4">Let&apos;s build you a LLM</h2>
                <div className="space-y-1 md:space-y-2 text-gray-600">
                  <p className="text-sm md:text-base">Tell us about your business to create a personalized AI solution:</p>
                  <ul className="list-disc list-inside space-y-0.5 md:space-y-1 ml-1 md:ml-2 text-xs md:text-base">
                    <li>What industry are you in and what does your company do?</li>
                    <li>How many employees do you have and what&apos;s your revenue range?</li>
                    <li>Who are your target customers and what challenges do you face?</li>
                    <li>What specific tasks would you like AI to help automate?</li>
                  </ul>
                </div>
              </div>
              
              {/* Input Component */}
                <div className="w-full max-w-lg">
                <PlaceholdersAndVanishInput
                  placeholders={[
                  "We run a healthcare clinic and need help with patient document analysis...",
                  "Our legal firm handles contract reviews and we need automation for due diligence...",
                  "We're an educational platform looking to personalize learning experiences...",
                  "Our fintech startup needs AI for fraud detection and risk assessment...",
                  "We're a retail company wanting to automate customer support and recommendations..."
                  ]}
                  onChange={(e) => console.log(e.target.value)}
                  onSubmit={(e) => {
                    e.preventDefault();
                    // Delay redirect to allow vanish animation to complete
                    setTimeout(() => {
                      router.push('/login');
                    }, 600);
                  }}
                />
                </div>
              
              {/* Additional Info */}
              <div className="mt-3 md:mt-6 text-center">
                <p className="text-xs md:text-sm text-gray-500">Press Enter to start creating your custom droplet</p>
              </div>
            </div>
          </ContainerScroll>
        </div>
      </div>
    </>
  );
}
