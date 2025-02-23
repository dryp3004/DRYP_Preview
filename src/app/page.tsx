import React from 'react';
import Link from 'next/link';
// import ProductSelectionPage from '@/app/product-selection/page.tsx';

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="py-16 flex flex-col items-center justify-center">
        <div className="container mx-auto px-4 text-center text-center">
          <h1 className="text-4xl text-white font-bold mb-4">Now style your DRYP with AI</h1>
          <p className="text-lg text-gray-300 mb-8">Choose from a variety of options to personalize your product</p>
          <Link href='/product-selection'>
            <button className="bg-white hover:bg-gray-200 text-black font-bold py-2 px-4 rounded">
              Start Customizing
            </button>
          </Link>
          <p className="mt-4 text-gray-300">Customize the final details and get your unique creation</p>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 bg-black">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-black w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-white">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Choose Your Base</h3>
              <p className="text-gray-300">
                Select from our collection of premium blank apparel
              </p>
            </div>
            <div className="text-center">
              <div className="bg-black w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-white">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Design with AI</h3>
              <p className="text-gray-300">
                Describe your perfect design and watch AI bring it to life
              </p>
            </div>
            <div className="text-center">
              <div className="bg-black w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-white">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Order & Wear</h3>
              <p className="text-gray-300">
                Customize the final details and get your unique creation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Selection Section */}
      {/* <ProductSelectionPage /> */}
    </main>
  )
}