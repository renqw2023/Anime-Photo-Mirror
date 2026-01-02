
import React, { useState, useRef, useCallback } from 'react';
import { GenerationState } from './types';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<GenerationState>({
    originalImage: null,
    characterName: '',
    isGenerating: false,
    resultImage: null,
    error: null,
    status: 'Waiting for upload...'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setState(prev => ({ 
          ...prev, 
          originalImage: reader.result as string,
          status: 'Ready to generate!'
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!state.originalImage || !state.characterName) {
      setState(prev => ({ ...prev, error: 'Please upload an image and enter a character name.' }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      error: null, 
      resultImage: null,
      status: 'Analyzing face and character...' 
    }));

    try {
      // 1. Generate structured prompt
      const promptData = await geminiService.generateCharacterPrompt(
        state.characterName, 
        state.originalImage
      );
      
      setState(prev => ({ ...prev, status: `Summoning ${state.characterName}...` }));

      // 2. Generate final composite image
      const result = await geminiService.generateCompositeImage(
        state.originalImage,
        promptData
      );

      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        resultImage: result,
        status: 'Creation complete!' 
      }));
    } catch (err: any) {
      console.error(err);
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        error: 'Generation failed. Please try again.',
        status: 'Error'
      }));
    }
  };

  const reset = () => {
    setState({
      originalImage: null,
      characterName: '',
      isGenerating: false,
      resultImage: null,
      error: null,
      status: 'Waiting for upload...'
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-12 text-center">
        <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 mb-4">
          ANIME MIRROR
        </h1>
        <p className="text-slate-400 text-lg">Step into the 3D anime world with your own face.</p>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Input */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-3xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm">1</span>
              Upload Your Portrait
            </h2>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`relative h-64 border-2 border-dashed rounded-2xl flex flex-center items-center justify-center cursor-pointer transition-all ${
                state.originalImage ? 'border-cyan-500/50' : 'border-slate-700 hover:border-slate-500'
              }`}
            >
              {state.originalImage ? (
                <img src={state.originalImage} className="h-full w-full object-cover rounded-2xl" alt="Source" />
              ) : (
                <div className="text-center p-4">
                  <div className="mb-2 text-slate-500">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-slate-400">Click or drag to upload photo</p>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
            </div>
          </div>

          <div className="glass p-6 rounded-3xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm">2</span>
              Choose Character
            </h2>
            <input 
              type="text"
              placeholder="e.g. Naruto, Rem, Pikachu, Luffy..."
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 mb-6"
              value={state.characterName}
              onChange={(e) => setState(prev => ({ ...prev, characterName: e.target.value }))}
            />

            <button
              onClick={handleGenerate}
              disabled={state.isGenerating || !state.originalImage || !state.characterName}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                state.isGenerating || !state.originalImage || !state.characterName
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {state.isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  GENERATING...
                </span>
              ) : 'GENERATE PHOTO'}
            </button>
            
            {state.status && (
              <p className="mt-4 text-center text-sm font-medium text-slate-400 animate-pulse">
                {state.status}
              </p>
            )}

            {state.error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                {state.error}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Result */}
        <div className="relative">
          <div className="glass p-6 rounded-3xl min-h-[500px] flex flex-col">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm">3</span>
              Magic Result
            </h2>
            
            <div className="flex-grow flex items-center justify-center bg-slate-900/50 rounded-2xl overflow-hidden relative">
              {state.resultImage ? (
                <div className="group relative w-full h-full">
                  <img src={state.resultImage} className="w-full h-full object-contain" alt="Result" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <a 
                      href={state.resultImage} 
                      download={`${state.characterName}_collab.png`}
                      className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-slate-200"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 space-y-4">
                  {state.isGenerating ? (
                    <div className="space-y-4">
                      <div className="w-24 h-24 mx-auto relative">
                        <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <p className="text-cyan-400 font-medium">Bending reality...</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-20 h-20 mx-auto text-slate-700">
                        <svg fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z"/>
                        </svg>
                      </div>
                      <p className="text-slate-600 max-w-[240px]">Your collaborative photo will appear here once generated.</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {state.resultImage && (
              <button 
                onClick={reset}
                className="mt-6 text-slate-400 hover:text-white transition-colors text-sm underline underline-offset-4 decoration-slate-700"
              >
                Create another one
              </button>
            )}
          </div>
          
          {/* Visual fluff */}
          <div className="absolute -z-10 -bottom-10 -right-10 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full"></div>
          <div className="absolute -z-10 -top-10 -left-10 w-64 h-64 bg-cyan-600/10 blur-[100px] rounded-full"></div>
        </div>
      </main>

      <footer className="mt-20 text-center text-slate-600 text-sm pb-8">
        Powered by Gemini AI • 2024 Anime Photo Mirror
      </footer>
    </div>
  );
};

export default App;
