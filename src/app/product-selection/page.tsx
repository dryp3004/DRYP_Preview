/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type ApparelType = 'T-Shirts' | 'Hoodies' | null;
type Size = 'S' | 'M' | 'L' | 'XL' | 'XXL' | null;

interface ApparelOption {
  type: ApparelType;
  image: string;
  alt: string;
  className?: string;
}

const designs = [
  { src: '/Images/option1.png' },
  { src: '/Images/option2.png' },
  { src: '/Images/option3.png' },
  { src: '/Images/option4.png' },
  { src: '/Images/option5.png' },
  { src: '/Images/option6.png' },
  { src: '/Images/option7.png' },
  { src: '/Images/option8.png' },
  { src: '/Images/option9.png' },
  { src: '/Images/option10.png' },
];

export default function ProductSelection() {
  const [selectedApparel, setSelectedApparel] = useState<ApparelType>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const router = useRouter();

  const apparelOptions: ApparelOption[] = [
    {
      type: 'T-Shirts',
      image: '/Images/tshirt.png',
      alt: 'T-Shirt'
    },
    {
      type: 'Hoodies',
      image: '/Images/hoodie.png',
      alt: 'Hoodie'
    }
  ];

  const handleProceed = () => {
    if (selectedApparel && selectedSize && selectedColor) {
      // Save selections to localStorage or state management solution
      const selections = {
        apparel: selectedApparel,
        size: selectedSize,
        color: selectedColor
      };
      localStorage.setItem('apparelSelections', JSON.stringify(selections));
      
      // Navigate to customization page
      router.push('/customisation');
    }
  };

  return (
    <main className="min-h-screen bg-black py-16 relative">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl text-white font-bold text-center mb-12">
          Make Your Own DRYP
        </h1>

        <div className="space-y-12">
          {/* Step 1: Apparel Selection with Images */}
          <div className="space-y-8">
            <h2 className="text-2xl text-white text-center mb-8">
              Choose Your Apparel Type
            </h2>
            <div className="flex justify-center gap-20">
              {apparelOptions.map((apparel) => (
                <button
                  key={apparel.type}
                  onClick={() => setSelectedApparel(apparel.type)}
                  className={`text-white flex flex-col items-center justify-center transition-all duration-300 ${
                    selectedApparel === apparel.type 
                      ? 'filter brightness-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' 
                      : 'hover:opacity-80'
                  }`}
                >
                  <div className={`relative mb-4 ${
                    apparel.type === 'T-Shirts' ? 'w-[340px] h-[340px]' : 'w-[410px] h-[410px]'
                  }`}>
                    <Image
                      src={apparel.image}
                      alt={apparel.alt}
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                  <span className="text-lg font-medium">{apparel.type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Size Selection */}
          {selectedApparel && (
            <div className="space-y-8">
              <h2 className="text-2xl text-white text-center mb-8">
                Choose Your Size
              </h2>
              <div className="flex justify-center gap-4">
                {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-16 h-16 border-2 rounded-full transition-all duration-200 ${
                      selectedSize === size
                        ? 'bg-white text-black border-white'
                        : 'border-white text-white hover:bg-white hover:text-black'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Color Selection */}
          {selectedApparel && (
            <div className="space-y-8">
              <h2 className="text-2xl text-white text-center mb-8">
                Choose Your Color
              </h2>
              <div className="flex justify-center gap-4">
                {['White', 'Black', 'Gray', 'Navy'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-16 h-16 rounded-full transition-transform duration-200 ${
                      selectedColor === color 
                        ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-black'
                        : 'hover:scale-110'
                    }`}
                    style={{
                      backgroundColor: color.toLowerCase(),
                      border: color.toLowerCase() === 'white' ? '2px solid #666' : '2px solid white'
                    }}
                    aria-label={color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Proceed Button */}
          {selectedApparel && selectedSize && selectedColor && (
            <div className="flex justify-center mt-12">
              <button
                onClick={handleProceed}
                className="bg-white text-black px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2"
              >
                Proceed to Customization
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M14 5l7 7m0 0l-7 7m7-7H3" 
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
